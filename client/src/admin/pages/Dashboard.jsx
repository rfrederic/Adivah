import { AlertTriangle, Clock, FilePlus2, FileUp, ImagePlus, Newspaper } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Empty, LoadError, Loading } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '../AuthContext';
import { formatDateTime } from '../components/Table';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user, can } = useAuth();
  const { data, error, loading, reload } = useApi('/api/admin/stats');
  const cards = data && [
    { key: 'projects', to: '/admin/projects', value: data.projects },
    { key: 'publishedArticles', to: '/admin/articles', value: data.publishedArticles },
    { key: 'draftArticles', to: '/admin/articles', value: data.draftArticles },
    { key: 'publications', to: '/admin/publications', value: data.publications },
    { key: 'campaigns', to: '/admin/campaigns', value: data.campaigns },
    { key: 'team', to: '/admin/team', value: data.team },
    { key: 'partners', to: '/admin/partners', value: data.partners },
    ...(data.newSubmissions !== undefined ? [{ key: 'newMessages', to: '/admin/messages', value: data.newSubmissions }] : []),
  ];
  const quick = [
    { to: '/admin/articles/new', key: 'newArticle', icon: Newspaper, show: can('content.write') },
    { to: '/admin/projects/new', key: 'newProject', icon: FilePlus2, show: can('content.write') },
    { to: '/admin/publications/new', key: 'newPublication', icon: FileUp, show: can('content.write') },
    { to: '/admin/media', key: 'media', icon: ImagePlus, show: can('media.write') },
  ].filter((q) => q.show);

  return (
    <>
      <h1 className="text-4xl">{t('admin.dashboard.welcome', { name: user.name })}</h1>
      <p className="mt-2 text-ink-soft">{t('admin.dashboard.intro')}</p>
      {quick.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {quick.map(({ to, key, icon: Icon }) => <Link key={key} to={to} className="btn btn-secondary btn-sm"><Icon aria-hidden="true" className="size-4" /> {t(`admin.dashboard.quick.${key}`)}</Link>)}
        </div>
      )}
      {loading && !data && <Loading />}
      {error && <div className="mt-6"><LoadError onRetry={reload} /></div>}
      {data && (
        <>
          {data.pending > 0 && can('content.review') && (
            <p className="mt-6 flex items-center gap-3 rounded-md border border-sky-300 bg-sky-50 p-4 font-semibold"><Clock aria-hidden="true" className="size-5 shrink-0 text-sky-800" /> {t('admin.dashboard.pending', { count: data.pending })}</p>
          )}
          {data.samples > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">{t('admin.dashboard.samplesTitle', { count: data.samples })}</p>
                <p className="text-sm">{t('admin.dashboard.samplesText')}</p>
              </div>
            </div>
          )}
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => (
              <li key={c.key}>
                <Link to={c.to} className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-sky-700">
                  <span className="block font-serif text-4xl">{c.value}</span>
                  <span className="mt-1 block text-sm text-ink-soft">{t(`admin.dashboard.${c.key}`)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <section aria-labelledby="recent" className="mt-8">
            <h2 id="recent" className="mb-3 text-2xl">{t('admin.dashboard.recent')}</h2>
            {!data.recent.length ? <Empty>{t('admin.dashboard.noRecent')}</Empty> : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                {data.recent.map((r) => (
                  <li key={r._id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
                    <span><strong>{r.actorName}</strong> · {t(`admin.audit.actions.${r.action}`, { defaultValue: r.action })}{r.targetLabel ? ` · ${r.targetLabel}` : ''}</span>
                    <time dateTime={r.createdAt} className="text-ink-soft">{formatDateTime(r.createdAt, i18n.language)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
