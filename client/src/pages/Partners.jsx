import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Empty, LoadError, Loading, PageHeader, Pagination, SampleBadge } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';
import { pick } from '@/lib/content';

export default function Partners() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [params, setParams] = useSearchParams();
  useSeo({ page: 'partners' });
  const query = new URLSearchParams({ limit: '24', page: params.get('page') || '1' });
  if (params.get('previewId')) query.set('previewId', params.get('previewId'));
  const { data, error, loading, reload } = useApi(`/api/partners?${query}`);
  return (
    <>
      <PageHeader title={t('partners.title')} intro={t('partners.intro')} />
      <div className="container-page py-12">
        {loading && !data && <Loading />}
        {error && <LoadError onRetry={reload} />}
        {data && !data.items.length && <Empty>{t('partners.empty')}</Empty>}
        {data && data.items.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((p) => (
              <li key={p._id} className="rounded-lg border border-slate-200 bg-white p-6">
                {p.image?.url && <img src={p.image.url} alt={pick(p.image.alt, lang) || p.name} loading="lazy" className="mb-4 h-16 w-auto object-contain" />}
                {p.isSample && <SampleBadge />}
                <h2 className="text-2xl">{p.name}</h2>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{pick(p.description, lang)}</p>
                {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="link-arrow mt-3 text-sm">{t('partners.website')} <ExternalLink aria-hidden="true" className="size-4" /></a>}
              </li>
            ))}
          </ul>
        )}
        {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setParams({ page: String(n) })} />}
      </div>
    </>
  );
}
