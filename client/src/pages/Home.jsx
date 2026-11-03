import { ArrowRight, HandHeart, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArticleCard, ProjectCard } from '@/components/content/Cards';
import { LogoImage } from '@/components/layout/Logo';
import { Empty, ImageSlot, LoadError, Loading, Reveal, SectionHeading } from '@/components/ui';
import { AREAS } from '@/config/areas';
import { useSettings } from '@/context/SettingsContext';
import { useApi } from '@/hooks/useApi';
import { useSeo } from '@/hooks/useSeo';
import { pick } from '@/lib/content';
import { routePath } from '@/lib/routes';

function Latest({ url, render }) {
  const { t } = useTranslation();
  const { data, error, loading, reload } = useApi(url);
  if (loading) return <Loading />;
  if (error) return <LoadError onRetry={reload} />;
  if (!data.items.length) return <Empty>{t('common.empty')}</Empty>;
  return <div className="rail">{data.items.map(render)}</div>;
}

/** Notre histoire : une photo d'une activité passée, avec sa légende, et le lien vers la publication historique. */
function StorySection({ settings, lang }) {
  const { t } = useTranslation();
  const { data } = useApi('/api/articles?layout=history&limit=1');
  const story = data?.items?.[0];
  const image = settings?.storyImage;
  return (
    <section aria-labelledby="story-title" className="bg-sky-800 text-white">
      <Reveal className="container-page grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2">
        <figure>
          <div className="overflow-hidden rounded-lg"><ImageSlot src={image?.url} alt={pick(image?.alt, lang)} className="aspect-[4/3]" sizes="(min-width: 1024px) 50vw, 100vw" /></div>
          {image?.url && pick(image.caption, lang) && <figcaption className="mt-2 text-sm text-sky-100">{pick(image.caption, lang)}</figcaption>}
        </figure>
        <div>
          <p className="eyebrow mb-3 text-sky-100">{t('home.storyEyebrow')}</p>
          <h2 id="story-title" className="text-3xl md:text-4xl">{t('home.storyTitle')}</h2>
          <p className="mt-4 text-lg leading-relaxed text-sky-50">{t('home.storyText')}</p>
          <Link to={story ? `${routePath('news', lang)}/${story.slug}` : routePath('news', lang)} className="btn mt-7 bg-white text-sky-900 hover:bg-sky-50">{t('home.storyCta')} <ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div>
      </Reveal>
    </section>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { settings, images } = useSettings();
  useSeo({ page: 'home' });
  const to = (key) => routePath(key, lang);

  return (
    <>
      <section className="relative bg-gradient-to-b from-sky-200 to-sky-100">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1"><span className="flex-1 bg-haiti-blue" /><span className="flex-1 bg-haiti-red" /></div>
        <div className="container-page grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <LogoImage className="size-20 shadow-sm" alt={t('brand.logoAlt')} />
              <p className="eyebrow max-w-xs text-sky-900">{t('home.eyebrow')}</p>
            </div>
            <h1 className="text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              <span className="block">{t('home.headline1')}</span>
              <span className="block">{t('home.headline2')}</span>
              <span className="block text-sky-800">{t('home.headline3')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{t('home.intro')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={to('involved')} className="btn btn-primary">{t('home.ctaInvolved')} <ArrowRight aria-hidden="true" className="size-4" /></Link>
              <Link to={to('about')} className="btn btn-secondary">{t('home.ctaAbout')}</Link>
            </div>
          </div>
          <figure>
            <div className="overflow-hidden rounded-lg border-4 border-white shadow-lg">
              <ImageSlot priority src={images.heroImage} alt={pick(settings?.imageText?.hero?.alt, lang) || t('brand.fullName')} className="aspect-[4/3] bg-white" sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
            {images.heroImage && pick(settings?.imageText?.hero?.caption, lang) && <figcaption className="mt-2 text-sm text-ink-soft">{pick(settings.imageText.hero.caption, lang)}</figcaption>}
          </figure>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <Reveal className="container-page grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow mb-3">{t('home.introEyebrow')}</p>
            <h2 className="text-3xl md:text-4xl">{t('home.introTitle')}</h2>
          </div>
          <div>
            <p className="text-lg leading-relaxed">{pick(settings?.mission, lang)}</p>
            <Link to={to('about')} className="link-arrow mt-5">{t('home.ctaAbout')} <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </div>
        </Reveal>
      </section>

      <section className="bg-sky-50 py-16 md:py-24">
        <div className="container-page">
          <SectionHeading eyebrow={t('home.areasEyebrow')} title={t('home.areasTitle')} action={<Link to={to('areas')} className="link-arrow">{t('common.viewAll')} <ArrowRight aria-hidden="true" className="size-4" /></Link>} />
          <ul className="rail">
            {AREAS.map(({ key, icon: Icon }) => {
              const image = settings?.areaImages?.[key];
              return (
                <li key={key}>
                  <Link to={`${to('areas')}#${key}`} className="card-lift group flex h-full flex-col overflow-hidden rounded-lg border border-sky-200 bg-white">
                    <div className="relative overflow-hidden">
                      <ImageSlot src={image?.url} alt={pick(image?.alt, lang)} className="aspect-[16/9]" imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" />
                      <span className="absolute bottom-3 left-3 flex size-11 items-center justify-center rounded-full bg-white text-sky-800 shadow"><Icon aria-hidden="true" className="size-6" strokeWidth={1.5} /></span>
                    </div>
                    <div className="flex-1 p-6">
                      <h3 className="text-xl leading-snug">{t(`areaKeys.${key}`)}</h3>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{t(`areas.items.${key}.text`)}</p>
                      {image?.url && pick(image.caption, lang) && <p className="mt-3 text-xs text-ink-soft">{t('home.photoContext')}{t('common.colon')}{pick(image.caption, lang)}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-page">
          <SectionHeading eyebrow={t('home.projectsEyebrow')} title={t('home.projectsTitle')} action={<Link to={to('projects')} className="link-arrow">{t('common.viewAll')} <ArrowRight aria-hidden="true" className="size-4" /></Link>} />
          <Latest url="/api/projects?limit=3" render={(p) => <ProjectCard key={p._id} project={p} />} />
        </div>
      </section>

      <StorySection settings={settings} lang={lang} />

      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container-page">
          <SectionHeading eyebrow={t('home.newsEyebrow')} title={t('home.newsTitle')} action={<Link to={to('news')} className="link-arrow">{t('common.viewAll')} <ArrowRight aria-hidden="true" className="size-4" /></Link>} />
          <Latest url="/api/articles?limit=3" render={(a) => <ArticleCard key={a._id} article={a} />} />
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <Reveal className="rounded-lg bg-sky-100 p-8 md:p-10">
            <Users aria-hidden="true" className="mb-4 size-8 text-sky-800" strokeWidth={1.5} />
            <h2 className="text-3xl">{t('home.volunteerTitle')}</h2>
            <p className="mt-3 leading-relaxed">{t('home.volunteerText')}</p>
            <Link to={to('involved')} className="btn btn-primary mt-6">{t('home.volunteerCta')}</Link>
          </Reveal>
          <Reveal className="rounded-lg border border-sky-200 p-8 md:p-10">
            <HandHeart aria-hidden="true" className="mb-4 size-8 text-sky-800" strokeWidth={1.5} />
            <h2 className="text-3xl">{t('home.supportTitle')}</h2>
            <p className="mt-3 leading-relaxed">{t('home.supportText')}</p>
            <Link to={to('contact')} className="btn btn-secondary mt-6">{t('home.supportCta')}</Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-sky-700 text-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-6 py-14">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl">{t('home.contactTitle')}</h2>
            <p className="mt-2 text-sky-50">{t('home.contactText')}</p>
          </div>
          <Link to={to('contact')} className="btn bg-white text-sky-900 hover:bg-sky-50">{t('home.contactCta')}</Link>
        </div>
      </section>
    </>
  );
}
