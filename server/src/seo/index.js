import fs from 'node:fs';
import { createRequire } from 'node:module';
import { env } from '../config/env.js';
import { Article } from '../models/Article.js';
import { Campaign } from '../models/Campaign.js';
import { getSettings } from '../models/Settings.js';
import { Project } from '../models/Project.js';

const require = createRequire(import.meta.url);
const site = require('../../../shared/site.json');

const LANGS = ['fr', 'en'];
const DEFAULT_SHARE_IMAGE = '/images/brand/logo-512.jpg';
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escapeXml = escapeHtml;
const abs = (p) => `${env.SITE_URL}${encodeURI(p)}`;

const DETAIL_ROUTES = [
  { key: 'projects', Model: Project, type: 'project', description: 'summary' },
  { key: 'news', Model: Article, type: 'article', description: 'excerpt' },
  { key: 'campaigns', Model: Campaign, type: 'project', description: 'summary' },
];

/** Identifie la page demandée à partir de l'URL, y compris les pages de détail. */
async function resolvePage(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  for (const lang of LANGS) {
    for (const [key, paths] of Object.entries(site.routes)) {
      if (paths[lang] === clean) {
        return { lang, key, paths, ...site.seo[lang][key], ogType: 'website' };
      }
    }
    for (const { key, Model, type, description } of DETAIL_ROUTES) {
      const prefix = `${site.routes[key][lang]}/`;
      if (clean.startsWith(prefix)) {
        const slug = clean.slice(prefix.length);
        if (!/^[a-z0-9-]{1,100}$/.test(slug)) return { missing: true, lang };
        const item = await Model.findOne({ slug, published: true }).lean();
        if (!item) return { missing: true, lang };
        return {
          lang,
          paths: { fr: `${site.routes[key].fr}/${slug}`, en: `${site.routes[key].en}/${slug}` },
          title: item.seo?.title?.[lang] || `${item.title[lang] || item.title.fr} – ADIVAH`,
          description: item.seo?.description?.[lang] || item[description]?.[lang] || item[description]?.fr || site.seo[lang].home.description,
          keywords: item.seo?.keywords?.[lang],
          image: item.image?.url,
          ogType: type === 'article' ? 'article' : 'website',
          noindex: item.isSample,
        };
      }
    }
  }
  return { missing: true, lang: clean === '/en' || clean.startsWith('/en/') ? 'en' : 'fr' };
}

function headTags(page, langs = LANGS) {
  const lang = page.lang;
  const { title, description } = page.missing ? { ...site.seo[lang].home, title: `404 – ADIVAH` } : page;
  const url = page.paths ? abs(page.paths[lang]) : null;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta property="og:site_name" content="ADIVAH" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="${page.ogType ?? 'website'}" />`,
    `<meta property="og:locale" content="${lang === 'fr' ? 'fr_HT' : 'en_US'}" />`,
    `<meta name="twitter:card" content="${page.image ? 'summary_large_image' : 'summary'}" />`,
  ];
  // Image de partage par défaut : le logo officiel.
  if (!page.image && !page.missing) page.image = DEFAULT_SHARE_IMAGE;
  if (page.keywords) tags.push(`<meta name="keywords" content="${escapeHtml(page.keywords)}" />`);
  if (page.image) tags.push(`<meta property="og:image" content="${escapeHtml(abs(page.image))}" />`);
  if (page.missing || page.noindex) tags.push('<meta name="robots" content="noindex" />');
  if (url) {
    tags.push(
      `<link rel="canonical" href="${escapeHtml(url)}" />`,
      `<meta property="og:url" content="${escapeHtml(url)}" />`,
      ...langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${escapeHtml(abs(page.paths[l]))}" />`),
      `<link rel="alternate" hreflang="x-default" href="${escapeHtml(abs(page.paths.fr))}" />`,
    );
  }
  return tags.join('\n    ');
}

/** Sert l'application React avec les métadonnées de chaque page déjà présentes dans le HTML (moteurs de recherche, réseaux sociaux). */
export function renderIndex(indexPath) {
  const template = fs.readFileSync(indexPath, 'utf8');
  return async (req, res) => {
    const isAdmin = req.path === '/admin' || req.path.startsWith('/admin/');
    const page = isAdmin ? { lang: 'fr', missing: true } : await resolvePage(req.path);
    const settings = await getSettings();
    // Version anglaise désactivée depuis le tableau de bord : les visiteurs sont renvoyés vers le français.
    if (!isAdmin && settings.englishEnabled === false && page.lang === 'en') {
      return res.redirect(302, page.paths?.fr ?? '/');
    }
    if (page.key === 'home') {
      page.title = settings.seo?.homeTitle?.[page.lang] || page.title;
      page.description = settings.seo?.homeDescription?.[page.lang] || page.description;
    }
    if (!isAdmin && !page.image && settings.seo?.ogImageUrl) page.image = settings.seo.ogImageUrl;
    const maintenance = !isAdmin && settings.maintenance?.enabled;
    if (maintenance) page.noindex = true;
    const html = template
      .replace('<html lang="fr">', `<html lang="${page.lang}">`)
      .replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, headTags(page, settings.englishEnabled === false ? ['fr'] : LANGS));
    if (maintenance) res.set('Retry-After', '3600');
    return res.status(maintenance ? 503 : page.missing && !isAdmin ? 404 : 200).type('html').set('Cache-Control', 'no-cache').send(html);
  };
}

export function robotsTxt(_req, res) {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${abs('/sitemap.xml')}\n`);
}

export async function sitemapXml(_req, res) {
  const entries = Object.values(site.routes).map((paths) => ({ paths }));
  for (const { key, Model } of DETAIL_ROUTES) {
    // Les exemples à remplacer ne sont jamais proposés à l'indexation.
    const items = await Model.find({ published: true, isSample: false }).select('slug updatedAt').lean();
    for (const item of items) {
      entries.push({
        paths: { fr: `${site.routes[key].fr}/${item.slug}`, en: `${site.routes[key].en}/${item.slug}` },
        lastmod: item.updatedAt.toISOString(),
      });
    }
  }
  const { englishEnabled } = await getSettings();
  const urls = entries.flatMap(({ paths, lastmod }) =>
    (englishEnabled === false ? ['fr'] : LANGS).map(
      (lang) => `  <url>
    <loc>${escapeXml(abs(paths[lang]))}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
${(englishEnabled === false ? ['fr'] : LANGS).map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(abs(paths[l]))}" />`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(abs(paths.fr))}" />
  </url>`,
    ),
  );
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
}
