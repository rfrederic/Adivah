import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PublicationRow } from '@/components/content/Cards';
import { Empty, FilterGroup, LoadError, Loading, PageHeader, Pagination } from '@/components/ui';
import { PUBLICATION_TYPES } from '@/config/areas';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';

export default function Publications() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  useSeo({ page: 'publications' });
  const type = params.get('type') ?? '';
  const page = Number(params.get('page')) || 1;
  const query = new URLSearchParams({ limit: '10', page: String(page) });
  if (type) query.set('type', type);
  if (params.get('previewId')) query.set('previewId', params.get('previewId'));
  const { data, error, loading, reload } = useApi(`/api/publications?${query}`);

  return (
    <>
      <PageHeader title={t('publications.title')} intro={t('publications.intro')} />
      <div className="container-page py-12">
        <FilterGroup
          label={t('publications.filter')}
          allLabel={t('common.all')}
          value={type}
          onChange={(v) => setParams(v ? { type: v } : {})}
          options={PUBLICATION_TYPES.map((p) => ({ value: p, label: t(`publicationType.${p}`) }))}
        />
        <div className="mt-8">
          {loading && !data && <Loading />}
          {error && <LoadError onRetry={reload} />}
          {data && !data.items.length && <Empty>{t('publications.empty')}</Empty>}
          {data && data.items.length > 0 && (
            <>
              <div className="space-y-4">{data.items.map((p) => <PublicationRow key={p._id} publication={p} />)}</div>
              <Pagination page={data.page} pages={data.pages} onChange={(n) => setParams({ ...(type ? { type } : {}), page: String(n) })} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
