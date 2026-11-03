import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ShareLinks } from '@/components/content/ShareLinks';
import { ImageSlot, LoadError, Loading, SampleBadge, Tag } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';
import { formatDate, paragraphs, pick } from '@/lib/content';
import { isPreviewMode, routes, routePath } from '@/lib/routes';
import HistoryPublication from './HistoryPublication';
import NotFound from './NotFound';

export default function ArticleDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: article, error, loading, reload } = useApi(`/api/articles/${encodeURIComponent(slug)}${isPreviewMode() ? '?preview=1' : ''}`);

  useSeo(
    article
      ? {
          title: pick(article.seo?.title, lang) || `${pick(article.title, lang)} – ADIVAH`,
          description: pick(article.seo?.description, lang) || pick(article.excerpt, lang) || undefined,
          keywords: pick(article.seo?.keywords, lang) || undefined,
          paths: { fr: `${routes.news.fr}/${slug}`, en: `${routes.news.en}/${slug}` },
          noindex: article.isSample,
        }
      : {},
  );

  if (loading) return <div className="container-page py-16"><Loading /></div>;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container-page py-16"><LoadError onRetry={reload} /></div>;

  if (article.layout === 'history') return <HistoryPublication article={article} />;

  const title = pick(article.title, lang);
  return (
    <article className="container-page max-w-3xl py-10 md:py-14">
      <Link to={routePath('news', lang)} className="link-arrow mb-6 text-sm"><ArrowLeft aria-hidden="true" className="size-4" /> {t('news.backToList')}</Link>
      <div className="mb-3 flex flex-wrap gap-2">
        <Tag>{t(`articleCategory.${article.category}`)}</Tag>
        {article.isSample && <SampleBadge />}
      </div>
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      <p className="mt-4 text-ink-soft">
        {article.publishedAt ? <time dateTime={article.publishedAt}>{t('news.publishedOn', { date: formatDate(article.publishedAt, lang) })}</time> : t('common.dateTbc')}
      </p>
      <div className="mt-8 overflow-hidden rounded-lg"><ImageSlot src={article.image?.url} alt={pick(article.image?.alt, lang)} /></div>
      <div className="prose-page my-8">{paragraphs(pick(article.body, lang) || pick(article.excerpt, lang)).map((p) => <p key={p}>{p}</p>)}</div>
      <ShareLinks title={title} />
    </article>
  );
}
