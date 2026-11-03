import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { paragraphs, pick } from '@/lib/content';
import { responsive } from '@/lib/images';
import { routePath } from '@/lib/routes';

/** Présente la publication historique publiée la plus récente, avec une photo de chacune de ses premières activités. */
export function HistoryTeaser() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: list } = useApi('/api/articles?layout=history&limit=1');
  const slug = list?.items?.[0]?.slug;
  const { data: article } = useApi(slug ? `/api/articles/${slug}` : null);
  if (!article) return null;
  const photos = (article.sections ?? []).filter((s) => s.photos?.length).slice(0, 4).map((s) => ({ ...s.photos[0], where: [pick(s.date, lang), pick(s.location, lang)].filter(Boolean).join(' · ') }));
  const to = `${routePath('news', lang)}/${article.slug}`;
  return (
    <div>
      <p className="text-lg font-semibold">{pick(article.title, lang)}</p>
      <div className="mt-3 space-y-3 text-[1.0625rem] leading-relaxed">{paragraphs(pick(article.body, lang)).slice(0, 2).map((p) => <p key={p}>{p}</p>)}</div>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {photos.map((p) => (
          <li key={p.url}>
            <Link to={to} className="group block overflow-hidden rounded-lg">
              <img {...responsive(p.url)} sizes="(min-width: 768px) 20vw, 50vw" alt={pick(p.alt, lang)} loading="lazy" decoding="async" className="aspect-square w-full object-cover object-[50%_30%] transition-transform duration-500 group-hover:scale-[1.04]" />
            </Link>
            <p className="mt-1.5 text-xs text-ink-soft">{p.where}</p>
          </li>
        ))}
      </ul>
      <Link to={to} className="link-arrow mt-5">{t('history.read')} <ArrowRight aria-hidden="true" className="size-4" /></Link>
    </div>
  );
}
