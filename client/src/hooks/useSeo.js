import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import site from '@shared/site.json';
import { useSettings } from '@/context/SettingsContext';
import { LANGS, routes } from '@/lib/routes';

function setMeta(attr, name, content) {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
}

/**
 * Tient les métadonnées à jour pendant la navigation. Le premier chargement les reçoit déjà
 * du serveur (server/src/seo), ce qui les rend lisibles par les moteurs et les réseaux sociaux.
 */
export function useSeo({ page, title, description, keywords, paths, noindex = false }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const { settings } = useSettings();
  const custom = page === 'home' ? settings?.seo : null;
  const finalTitle = title ?? (custom?.homeTitle?.[lang] || site.seo[lang][page]?.title);
  const finalDescription = description ?? (custom?.homeDescription?.[lang] || site.seo[lang][page]?.description) ?? site.seo[lang].home.description;
  const finalPaths = paths ?? (page ? routes[page] : null);

  useEffect(() => {
    if (!finalTitle) return;
    document.title = finalTitle;
    setMeta('name', 'description', finalDescription);
    setMeta('property', 'og:title', finalTitle);
    setMeta('property', 'og:description', finalDescription);
    const existingKeywords = document.head.querySelector('meta[name="keywords"]');
    if (keywords) setMeta('name', 'keywords', keywords);
    else existingKeywords?.remove();
    const robots = document.head.querySelector('meta[name="robots"]');
    if (noindex) setMeta('name', 'robots', 'noindex');
    else robots?.remove();
    if (finalPaths) {
      const { origin } = window.location;
      setLink('link[rel="canonical"]', { rel: 'canonical', href: origin + finalPaths[lang] });
      LANGS.forEach((l) => {
        setLink(`link[rel="alternate"][hreflang="${l}"]`, { rel: 'alternate', hreflang: l, href: origin + finalPaths[l] });
      });
    }
  }, [finalTitle, finalDescription, finalPaths?.fr, finalPaths?.en, lang, noindex, keywords]); // eslint-disable-line react-hooks/exhaustive-deps
}
