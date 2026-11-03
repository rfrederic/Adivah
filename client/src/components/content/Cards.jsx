import { ArrowRight, Calendar, Download, FileText, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ImageSlot, SampleBadge, Tag } from '@/components/ui';
import { formatDate, formatPartialDate, formatSize, pick } from '@/lib/content';
import { routePath } from '@/lib/routes';

export function ProjectCard({ project }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const to = `${routePath('projects', lang)}/${project.slug}`;
  return (
    <article className="card-lift group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-hidden"><ImageSlot src={project.image?.url} alt={pick(project.image?.alt, lang)} imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" /></div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Tag>{t(`projectStatus.${project.status}`)}</Tag>
          {project.isSample && <SampleBadge />}
        </div>
        <h3 className="text-xl leading-snug"><Link to={to} className="hover:text-sky-800">{pick(project.title, lang)}</Link></h3>
        <p className="mt-1 text-sm font-medium text-sky-800">{t(`areaKeys.${project.category}`)}</p>
        <p className="mt-3 line-clamp-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft">{pick(project.summary, lang)}</p>
        <dl className="mt-4 space-y-1 text-sm text-ink-soft">
          <div className="flex items-center gap-2"><MapPin aria-hidden="true" className="size-4 shrink-0" /><dt className="sr-only">{t('common.location')}</dt><dd>{pick(project.location, lang) || t('common.locationTbc')}</dd></div>
          <div className="flex items-center gap-2"><Calendar aria-hidden="true" className="size-4 shrink-0" /><dt className="sr-only">{t('common.date')}</dt><dd>{formatPartialDate(project.date, project.datePrecision, lang) || t('common.dateTbc')}</dd></div>
        </dl>
        <Link to={to} className="link-arrow mt-4 text-sm" aria-label={`${t('common.readMore')}${t('common.colon')}${pick(project.title, lang)}`}>
          {t('common.readMore')} <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function ArticleCard({ article }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const to = `${routePath('news', lang)}/${article.slug}`;
  return (
    <article className="card-lift group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-hidden"><ImageSlot src={article.image?.url} alt={pick(article.image?.alt, lang)} imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" /></div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Tag>{t(`articleCategory.${article.category}`)}</Tag>
          {article.isSample && <SampleBadge />}
        </div>
        <h3 className="text-xl leading-snug"><Link to={to} className="hover:text-sky-800">{pick(article.title, lang)}</Link></h3>
        <p className="mt-2 text-sm text-ink-soft">{formatDate(article.publishedAt, lang) || t('common.dateTbc')}</p>
        <p className="mt-3 line-clamp-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft">{pick(article.excerpt, lang)}</p>
        <Link to={to} className="link-arrow mt-4 text-sm" aria-label={`${t('common.readMore')}${t('common.colon')}${pick(article.title, lang)}`}>
          {t('common.readMore')} <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function PublicationRow({ publication }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const size = formatSize(publication.fileSize);
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-start">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-800"><FileText aria-hidden="true" className="size-5" /></span>
      <div className="flex-1">
        <div className="mb-2 flex flex-wrap gap-2">
          <Tag>{t(`publicationType.${publication.type}`)}</Tag>
          {publication.isSample && <SampleBadge />}
        </div>
        <h3 className="text-xl leading-snug">{pick(publication.title, lang)}</h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{pick(publication.description, lang)}</p>
        <p className="mt-2 text-sm text-ink-soft">
          {t('publications.language')}{t('common.colon')}{t(`publications.languages.${publication.language}`)}
          {publication.year ? ` · ${t('publications.year')}${t('common.colon')}${publication.year}` : ''}
        </p>
      </div>
      {publication.fileUrl ? (
        <a href={publication.fileUrl} download className="btn btn-primary btn-sm shrink-0">
          <Download aria-hidden="true" className="size-4" /> {t('publications.download')}{size ? ` (${size})` : ''}
        </a>
      ) : (
        <span className="shrink-0 rounded-md bg-slate-100 px-3 py-2 text-sm text-ink-soft">{t('publications.unavailable')}</span>
      )}
    </article>
  );
}
