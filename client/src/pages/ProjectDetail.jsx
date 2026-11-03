import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Gallery } from '@/components/content/Gallery';
import { ShareLinks } from '@/components/content/ShareLinks';
import { ImageSlot, LoadError, Loading, SampleBadge, Tag } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';
import { formatPartialDate, paragraphs, pick } from '@/lib/content';
import { isPreviewMode, routes, routePath } from '@/lib/routes';
import NotFound from './NotFound';

export default function ProjectDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: project, error, loading, reload } = useApi(`/api/projects/${encodeURIComponent(slug)}${isPreviewMode() ? '?preview=1' : ''}`);

  useSeo(
    project
      ? {
          title: `${pick(project.title, lang)} – ADIVAH`,
          description: pick(project.summary, lang) || undefined,
          paths: { fr: `${routes.projects.fr}/${slug}`, en: `${routes.projects.en}/${slug}` },
          noindex: project.isSample,
        }
      : {},
  );

  if (loading) return <div className="container-page py-16"><Loading /></div>;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container-page py-16"><LoadError onRetry={reload} /></div>;

  const title = pick(project.title, lang);
  return (
    <article className="container-page max-w-4xl py-10 md:py-14">
      <Link to={routePath('projects', lang)} className="link-arrow mb-6 text-sm"><ArrowLeft aria-hidden="true" className="size-4" /> {t('projects.backToList')}</Link>
      <div className="mb-3 flex flex-wrap gap-2">
        <Tag>{t(`projectStatus.${project.status}`)}</Tag>
        {project.isSample && <SampleBadge />}
      </div>
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      {project.gallery?.length ? (
        <Gallery photos={project.gallery} lang={lang} className="mt-8" />
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg"><ImageSlot priority sizes="(min-width: 896px) 896px, 100vw" src={project.image?.url} alt={pick(project.image?.alt, lang)} /></div>
      )}
      <dl aria-label={t('projects.details')} className="mt-8 grid gap-4 rounded-lg bg-sky-50 p-5 sm:grid-cols-3">
        <div><dt className="text-sm font-semibold">{t('common.category')}</dt><dd>{t(`areaKeys.${project.category}`)}</dd></div>
        <div><dt className="text-sm font-semibold">{t('common.location')}</dt><dd>{pick(project.location, lang) || t('common.locationTbc')}</dd></div>
        <div><dt className="text-sm font-semibold">{t('common.date')}</dt><dd>{formatPartialDate(project.date, project.datePrecision, lang) || t('common.dateTbc')}</dd></div>
      </dl>
      <div className="prose-page my-8">{paragraphs(pick(project.body, lang) || pick(project.summary, lang)).map((p) => <p key={p}>{p}</p>)}</div>
      <ShareLinks title={title} />
    </article>
  );
}
