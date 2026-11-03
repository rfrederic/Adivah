import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ShareLinks } from '@/components/content/ShareLinks';
import { ImageSlot, LoadError, Loading, SampleBadge, Tag } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';
import { formatDate, paragraphs, pick } from '@/lib/content';
import { isPreviewMode, routes, routePath } from '@/lib/routes';
import NotFound from './NotFound';

export default function CampaignDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: campaign, error, loading, reload } = useApi(`/api/campaigns/${encodeURIComponent(slug)}${isPreviewMode() ? '?preview=1' : ''}`);

  useSeo(
    campaign
      ? {
          title: `${pick(campaign.title, lang)} – ADIVAH`,
          description: pick(campaign.summary, lang) || undefined,
          paths: { fr: `${routes.campaigns.fr}/${slug}`, en: `${routes.campaigns.en}/${slug}` },
          noindex: campaign.isSample,
        }
      : {},
  );

  if (loading) return <div className="container-page py-16"><Loading /></div>;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container-page py-16"><LoadError onRetry={reload} /></div>;

  const title = pick(campaign.title, lang);
  return (
    <article className="container-page max-w-4xl py-10 md:py-14">
      <Link to={routePath('campaigns', lang)} className="link-arrow mb-6 text-sm"><ArrowLeft aria-hidden="true" className="size-4" /> {t('campaigns.backToList')}</Link>
      <div className="mb-3 flex flex-wrap gap-2"><Tag>{t(`campaigns.status.${campaign.campaignStatus}`)}</Tag>{campaign.isSample && <SampleBadge />}</div>
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      <div className="mt-8 overflow-hidden rounded-lg"><ImageSlot src={campaign.image?.url} alt={pick(campaign.image?.alt, lang)} /></div>
      <dl className="mt-8 grid gap-4 rounded-lg bg-sky-50 p-5 sm:grid-cols-2">
        <div><dt className="text-sm font-semibold">{t('campaigns.start')}</dt><dd>{formatDate(campaign.startDate, lang) || t('common.dateTbc')}</dd></div>
        <div><dt className="text-sm font-semibold">{t('campaigns.end')}</dt><dd>{formatDate(campaign.endDate, lang) || t('common.dateTbc')}</dd></div>
      </dl>
      <div className="prose-page my-8">{paragraphs(pick(campaign.body, lang) || pick(campaign.summary, lang)).map((p) => <p key={p}>{p}</p>)}</div>
      <ShareLinks title={title} />
    </article>
  );
}
