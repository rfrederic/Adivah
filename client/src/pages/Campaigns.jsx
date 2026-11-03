import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { Empty, ImageSlot, LoadError, Loading, PageHeader, Pagination, SampleBadge, Tag } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';
import { pick } from '@/lib/content';
import { routePath } from '@/lib/routes';

export default function Campaigns() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [params, setParams] = useSearchParams();
  useSeo({ page: 'campaigns' });
  const { data, error, loading, reload } = useApi(`/api/campaigns?limit=12&page=${Number(params.get('page')) || 1}`);
  return (
    <>
      <PageHeader title={t('campaigns.title')} intro={t('campaigns.intro')} />
      <div className="container-page py-12">
        {loading && !data && <Loading />}
        {error && <LoadError onRetry={reload} />}
        {data && !data.items.length && <Empty>{t('campaigns.empty')}</Empty>}
        {data && data.items.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((c) => {
              const to = `${routePath('campaigns', lang)}/${c.slug}`;
              return (
                <article key={c._id} className="card-lift flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <ImageSlot src={c.image?.url} alt={pick(c.image?.alt, lang)} />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex flex-wrap gap-2"><Tag>{t(`campaigns.status.${c.campaignStatus}`)}</Tag>{c.isSample && <SampleBadge />}</div>
                    <h2 className="text-xl leading-snug"><Link to={to} className="hover:text-sky-800">{pick(c.title, lang)}</Link></h2>
                    <p className="mt-3 line-clamp-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft">{pick(c.summary, lang)}</p>
                    <Link to={to} className="link-arrow mt-4 text-sm" aria-label={`${t('common.readMore')}${t('common.colon')}${pick(c.title, lang)}`}>{t('common.readMore')} <ArrowRight aria-hidden="true" className="size-4" /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setParams({ page: String(n) })} />}
      </div>
    </>
  );
}
