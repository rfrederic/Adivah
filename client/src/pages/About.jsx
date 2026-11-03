import { Check, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImageSlot, Loading, PageHeader, Reveal, ToComplete } from '@/components/ui';
import { HistoryTeaser } from '@/components/content/HistoryTeaser';
import { useSettings } from '@/context/SettingsContext';
import { useSeo } from '@/hooks/useSeo';
import { lines, paragraphs, pick } from '@/lib/content';

function Text({ value }) {
  const items = paragraphs(value);
  if (!items.length) return <p><ToComplete /></p>;
  return <div className="prose-page">{items.map((p) => <p key={p}>{p}</p>)}</div>;
}

function List({ value, columns = false }) {
  const items = lines(value);
  if (!items.length) return <p><ToComplete /></p>;
  return (
    <ul className={`grid gap-3 ${columns ? 'sm:grid-cols-2' : ''}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[1.0625rem] leading-relaxed">
          <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-sky-700" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const Block = ({ title, children, tinted = false }) => (
  <section className={tinted ? 'bg-sky-50 py-14 md:py-20' : 'py-14 md:py-20'}>
    <Reveal className="container-page grid gap-6 lg:grid-cols-[1fr_2fr]">
      <h2 className="text-3xl">{title}</h2>
      <div className="max-w-3xl">{children}</div>
    </Reveal>
  </section>
);

export default function About() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { settings, images } = useSettings();
  useSeo({ page: 'about' });
  const get = (name) => pick(settings?.[name], lang);

  return (
    <>
      <PageHeader title={t('about.title')} intro={t('about.intro')} />
      {!settings ? (
        <div className="container-page"><Loading /></div>
      ) : (
        <>
          {settings.aboutIsDraft && (
            <div className="container-page mt-6">
              <p className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> {t('about.draftNotice')}
              </p>
            </div>
          )}
          <Block title={t('about.presentation')}>
            <Text value={get('presentation')} />
            {images.aboutImage && (
              <figure className="mt-8">
                <div className="overflow-hidden rounded-lg"><ImageSlot src={images.aboutImage} alt={pick(settings.imageText?.about?.alt, lang) || t('about.imageLabel')} sizes="(min-width: 1024px) 60vw, 100vw" /></div>
                {pick(settings.imageText?.about?.caption, lang) && <figcaption className="mt-2 border-l-2 border-haiti-red pl-3 text-sm text-ink-soft">{pick(settings.imageText.about.caption, lang)}</figcaption>}
              </figure>
            )}
          </Block>
          <Block tinted title={t('about.history')}><HistoryTeaser /></Block>
          <Block title={t('about.mission')}><Text value={get('mission')} /></Block>
          <Block tinted title={t('about.vision')}><Text value={get('vision')} /></Block>
          <Block title={t('about.values')}><List columns value={get('values')} /></Block>
          <Block tinted title={t('about.objectives')}><List value={get('objectives')} /></Block>
          <Block title={t('about.approach')}><Text value={get('approach')} /></Block>
          <Block tinted title={t('about.commitment')}><Text value={get('commitment')} /></Block>
        </>
      )}
    </>
  );
}
