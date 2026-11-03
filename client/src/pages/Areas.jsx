import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ImageSlot, PageHeader, Reveal } from '@/components/ui';
import { AREAS } from '@/config/areas';
import { useSettings } from '@/context/SettingsContext';
import { useSeo } from '@/hooks/useSeo';
import { pick } from '@/lib/content';
import { routePath } from '@/lib/routes';

/** Photo d'une activité passée liée à ce domaine, toujours accompagnée de sa légende historique. */
function AreaPhoto({ image, lang }) {
  const caption = pick(image?.caption, lang);
  return (
    <figure>
      <div className="overflow-hidden rounded-lg"><ImageSlot src={image?.url} alt={pick(image?.alt, lang)} className="aspect-[4/3]" sizes="(min-width: 1024px) 50vw, 100vw" /></div>
      {image?.url && caption && <figcaption className="mt-2 border-l-2 border-haiti-red pl-3 text-sm text-ink-soft">{caption}</figcaption>}
    </figure>
  );
}

export default function Areas() {
  const { t, i18n } = useTranslation();
  useSeo({ page: 'areas' });
  const { settings } = useSettings();
  const lang = i18n.language;
  return (
    <>
      <PageHeader title={t('areas.title')} intro={t('areas.intro')} />
      {AREAS.map(({ key, icon: Icon }, index) => (
        <section key={key} id={key} aria-labelledby={`area-${key}`} className={`scroll-mt-24 py-14 md:py-20 ${index % 2 ? 'bg-sky-50' : ''}`}>
          <Reveal className="container-page grid items-center gap-8 md:grid-cols-2 lg:gap-14">
            <div className={index % 2 ? 'md:order-2' : ''}>
              <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-sky-100 text-sky-800"><Icon aria-hidden="true" className="size-7" strokeWidth={1.5} /></span>
              <h2 id={`area-${key}`} className="text-3xl md:text-4xl">{t(`areaKeys.${key}`)}</h2>
              <p className="mt-4 text-lg leading-relaxed">{t(`areas.items.${key}.text`)}</p>
              <ul className="mt-5 space-y-2">
                {t(`areas.items.${key}.points`, { returnObjects: true }).map((point) => (
                  <li key={point} className="flex items-start gap-3"><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-sky-700" /> {point}</li>
                ))}
              </ul>
              <Link to={`${routePath('projects', i18n.language)}?category=${key}`} className="link-arrow mt-6">{t('areas.seeProjects')} <ArrowRight aria-hidden="true" className="size-4" /></Link>
            </div>
            <AreaPhoto image={settings?.areaImages?.[key]} lang={lang} />
          </Reveal>
        </section>
      ))}
    </>
  );
}
