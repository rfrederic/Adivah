import { ArrowRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Gallery } from '@/components/content/Gallery';
import { ShareLinks } from '@/components/content/ShareLinks';
import { responsive } from '@/lib/images';
import { useApi } from '@/hooks/useApi';
import { formatDate, paragraphs, pick } from '@/lib/content';
import { routePath } from '@/lib/routes';

function Section({ section, index, lang }) {
  const heading = pick(section.heading, lang);
  const date = pick(section.date, lang);
  const location = pick(section.location, lang);
  const reversed = index % 2 === 1;
  const photos = section.photos ?? [];
  return (
    <section id={section.key} aria-labelledby={`${section.key}-title`} className="scroll-mt-24 border-t border-slate-200 py-12 md:py-16">
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <div className={reversed ? 'md:order-2' : ''}>
          <p className="eyebrow">{date}</p>
          <h3 id={`${section.key}-title`} className="mt-2 text-3xl leading-tight md:text-4xl">{heading}</h3>
          {location && <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-sky-800"><MapPin aria-hidden="true" className="size-4" /> {location}</p>}
          <div className="prose-page mt-5">{paragraphs(pick(section.body, lang)).map((p) => <p key={p}>{p}</p>)}</div>
        </div>
        <Gallery photos={photos} lang={lang} className={reversed ? 'md:order-1' : ''} />
      </div>
    </section>
  );
}

/** Publication historique : mise en page éditoriale, entièrement alimentée par le contenu du tableau de bord. */
export default function HistoryPublication({ article }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const title = pick(article.title, lang);
  const sections = article.sections ?? [];
  const { data: related } = useApi('/api/articles?limit=6');
  const others = (related?.items ?? []).filter((a) => a.slug !== article.slug && !a.isSample).slice(0, 3);

  return (
    <article>
      <header className="bg-sky-100 pb-32 pt-12 md:pb-44 md:pt-16">
        <div className="container-page max-w-5xl">
          {article.logoUrl && <img src={article.logoUrl} alt={t('brand.logoAlt')} width="96" height="96" className="mb-6 size-24 rounded-full bg-white object-contain" />}
          <p className="eyebrow">{t(`articleCategory.${article.category}`)}{article.publishedAt ? ` · ${formatDate(article.publishedAt, lang)}` : ''}</p>
          <h1 className="mt-3 max-w-4xl text-4xl leading-tight md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl font-serif text-xl italic leading-relaxed text-ink-soft md:text-2xl">{pick(article.excerpt, lang)}</p>
        </div>
      </header>
      {article.image?.url && (
        <figure className="container-page -mt-24 max-w-6xl md:-mt-36">
          <div className="aspect-[16/9] overflow-hidden rounded-lg shadow-lg">
            <img {...responsive(article.image.url)} sizes="(min-width: 1152px) 1152px, 100vw" alt={pick(article.image.alt, lang)} fetchPriority="high" decoding="async" className="size-full origin-right scale-[1.12] object-cover" />
          </div>
          {pick(article.heroCaption, lang) && <figcaption className="mt-2 border-l-2 border-haiti-red pl-3 text-sm text-ink-soft">{pick(article.heroCaption, lang)}</figcaption>}
        </figure>
      )}
      <div className="container-page max-w-3xl py-12 md:py-16">
        <div className="space-y-5 text-lg leading-relaxed md:text-xl">{paragraphs(pick(article.body, lang)).map((p) => <p key={p}>{p}</p>)}</div>
      </div>

      {sections.length > 0 && (
        <div className="container-page max-w-6xl">
          <nav aria-labelledby="timeline-title" className="rounded-lg bg-sky-50 p-6 md:p-8">
            <h2 id="timeline-title" className="mb-6 text-3xl">{pick(article.timelineTitle, lang)}</h2>
            <ol className="grid gap-4 border-l-2 border-sky-300 pl-5 lg:grid-flow-col lg:auto-cols-fr lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-5">
              {sections.map((s) => (
                <li key={s.key} className="relative">
                  <span aria-hidden="true" className="absolute -left-[1.72rem] top-1.5 size-3 rounded-full bg-haiti-blue lg:-top-[1.72rem] lg:left-0" />
                  <a href={`#${s.key}`} className="block hover:text-sky-800 hover:underline">
                    <span className="block text-sm font-semibold">{pick(s.date, lang)}</span>
                    {pick(s.location, lang) && <span className="block text-sm text-ink-soft">{pick(s.location, lang)}</span>}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-8">{sections.map((s, i) => <Section key={s.key} section={s} index={i} lang={lang} />)}</div>
        </div>
      )}

      <section aria-labelledby="closing-title" className="bg-sky-800 text-white">
        <div className="container-page max-w-3xl py-14 md:py-20">
          <h2 id="closing-title" className="text-3xl md:text-4xl">{pick(article.closingTitle, lang)}</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-sky-50">{paragraphs(pick(article.closingBody, lang)).map((p) => <p key={p}>{p}</p>)}</div>
          {pick(article.closingHighlight, lang) && <p className="mt-6 text-lg font-bold">{pick(article.closingHighlight, lang)}</p>}
          {pick(article.signature, lang) && <p className="mt-6 text-sm text-sky-100">{pick(article.signature, lang)}</p>}
        </div>
      </section>
      {pick(article.finalMessage, lang) && (
        <div className="bg-white">
          <div aria-hidden="true" className="flex h-1"><span className="flex-1 bg-haiti-blue" /><span className="flex-1 bg-haiti-red" /></div>
          <blockquote className="container-page max-w-4xl py-14 text-center font-serif text-2xl leading-snug md:py-20 md:text-4xl">
            {lang === 'fr' ? `« ${pick(article.finalMessage, lang)} »` : `“${pick(article.finalMessage, lang)}”`}
          </blockquote>
        </div>
      )}

      <div className="container-page max-w-6xl pb-14">
        <ShareLinks title={title} />
        <section aria-labelledby="related-title" className="mt-10 border-t border-slate-200 pt-8">
          <h2 id="related-title" className="mb-4 text-2xl">{t('history.related')}</h2>
          {others.length > 0 && (
            <ul className="mb-5 grid gap-4 sm:grid-cols-3">
              {others.map((a) => <li key={a._id}><Link to={`${routePath('news', lang)}/${a.slug}`} className="block rounded-lg border border-slate-200 p-4 font-medium hover:border-sky-700">{pick(a.title, lang)}</Link></li>)}
            </ul>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to={routePath('news', lang)} className="link-arrow text-sm">{t('history.allNews')} <ArrowRight aria-hidden="true" className="size-4" /></Link>
            <Link to={routePath('publications', lang)} className="link-arrow text-sm">{t('history.allPublications')} <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </div>
        </section>
      </div>
    </article>
  );
}
