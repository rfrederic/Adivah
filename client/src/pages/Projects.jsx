import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ProjectCard } from '@/components/content/Cards';
import { Empty, FilterGroup, LoadError, Loading, PageHeader, Pagination } from '@/components/ui';
import { AREAS, PROJECT_STATUSES } from '@/config/areas';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';

export default function Projects() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  useSeo({ page: 'projects' });
  const category = params.get('category') ?? '';
  const status = params.get('status') ?? '';
  const page = Number(params.get('page')) || 1;

  const query = new URLSearchParams({ limit: '9', page: String(page) });
  if (category) query.set('category', category);
  if (status) query.set('status', status);
  const { data, error, loading, reload } = useApi(`/api/projects?${query}`);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  return (
    <>
      <PageHeader title={t('projects.title')} intro={t('projects.intro')} />
      <div className="container-page py-12">
        <FilterGroup
          label={t('projects.filterArea')}
          allLabel={t('common.all')}
          value={category}
          onChange={(v) => update({ category: v, page: '' })}
          options={AREAS.map(({ key }) => ({ value: key, label: t(`areaKeys.${key}`) }))}
        />
        <FilterGroup
          label={t('projects.filterStatus')}
          allLabel={t('common.all')}
          value={status}
          onChange={(v) => update({ status: v, page: '' })}
          options={PROJECT_STATUSES.map((s) => ({ value: s, label: t(`projectStatus.${s}`) }))}
        />
        <div className="mt-8">
          {loading && !data && <Loading />}
          {error && <LoadError onRetry={reload} />}
          {data && !data.items.length && <Empty>{t('projects.empty')}</Empty>}
          {data && data.items.length > 0 && (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.items.map((p) => <ProjectCard key={p._id} project={p} />)}
              </div>
              <Pagination page={data.page} pages={data.pages} onChange={(n) => update({ page: String(n) })} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
