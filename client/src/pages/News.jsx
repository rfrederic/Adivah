import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ArticleCard } from '@/components/content/Cards';
import { Empty, FilterGroup, LoadError, Loading, PageHeader, Pagination } from '@/components/ui';
import { ARTICLE_CATEGORIES } from '@/config/areas';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';

export default function News() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  useSeo({ page: 'news' });
  const category = params.get('category') ?? '';
  const page = Number(params.get('page')) || 1;
  const query = new URLSearchParams({ limit: '9', page: String(page) });
  if (category) query.set('category', category);
  const { data, error, loading, reload } = useApi(`/api/articles?${query}`);

  return (
    <>
      <PageHeader title={t('news.title')} intro={t('news.intro')} />
      <div className="container-page py-12">
        <FilterGroup
          label={t('news.filter')}
          allLabel={t('common.all')}
          value={category}
          onChange={(v) => setParams(v ? { category: v } : {})}
          options={ARTICLE_CATEGORIES.map((c) => ({ value: c, label: t(`articleCategory.${c}`) }))}
        />
        <div className="mt-8">
          {loading && !data && <Loading />}
          {error && <LoadError onRetry={reload} />}
          {data && !data.items.length && <Empty>{t('news.empty')}</Empty>}
          {data && data.items.length > 0 && (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.items.map((a) => <ArticleCard key={a._id} article={a} />)}
              </div>
              <Pagination
                page={data.page}
                pages={data.pages}
                onChange={(n) => setParams({ ...(category ? { category } : {}), page: String(n) })}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
