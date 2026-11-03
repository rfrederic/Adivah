import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Empty, ImageSlot, LoadError, Loading, PageHeader, Pagination, SampleBadge } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';
import { paragraphs, pick } from '@/lib/content';

export default function Team() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [params, setParams] = useSearchParams();
  useSeo({ page: 'team' });
  const query = new URLSearchParams({ limit: '24', page: params.get('page') || '1' });
  if (params.get('previewId')) query.set('previewId', params.get('previewId'));
  const { data, error, loading, reload } = useApi(`/api/team?${query}`);
  return (
    <>
      <PageHeader title={t('team.title')} intro={t('team.intro')} />
      <div className="container-page py-12">
        {loading && !data && <Loading />}
        {error && <LoadError onRetry={reload} />}
        {data && !data.items.length && <Empty>{t('team.empty')}</Empty>}
        {data && data.items.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((m) => (
              <li key={m._id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <ImageSlot src={m.image?.url} alt={pick(m.image?.alt, lang) || m.name} className="aspect-square" />
                <div className="p-5">
                  {m.isSample && <SampleBadge />}
                  <h2 className="text-2xl">{m.name}</h2>
                  <p className="mt-1 text-sm font-medium text-sky-800">{pick(m.position, lang)}</p>
                  <div className="mt-3 space-y-2 text-[0.9375rem] leading-relaxed text-ink-soft">{paragraphs(pick(m.bio, lang)).map((p) => <p key={p}>{p}</p>)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setParams({ page: String(n) })} />}
      </div>
    </>
  );
}
