import { Eye, Wrench } from 'lucide-react';
import { useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '@/context/SettingsContext';
import { pick } from '@/lib/content';
import { isPreviewMode, switchPath } from '@/lib/routes';
import { Footer } from './Footer';
import { Header } from './Header';

/** Mise en page publique. La langue vient de l'URL, ce qui garde le retour arrière et les liens partagés cohérents. */
export function SiteLayout({ lang }) {
  const { t, i18n } = useTranslation();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const preview = isPreviewMode();

  // Version anglaise désactivée dans les paramètres : retour vers la page française équivalente.
  useEffect(() => {
    if (lang === 'en' && settings?.englishEnabled === false && !preview) navigate(switchPath(pathname, 'fr'), { replace: true });
  }, [lang, settings?.englishEnabled, preview, pathname, navigate]);

  useLayoutEffect(() => {
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang, i18n]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, search]);

  if (settings?.maintenance?.enabled && !preview) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-sky-100 p-6 text-center">
        <div className="max-w-lg">
          <Wrench aria-hidden="true" className="mx-auto mb-4 size-10 text-sky-800" />
          <h1 className="text-4xl">{t('maintenance.title')}</h1>
          <p className="mt-3 text-lg text-ink-soft">{pick(settings.maintenance.message, lang) || t('maintenance.text')}</p>
          <p className="mt-6 text-sm text-ink-soft">{t('brand.fullName')} (ADIVAH)</p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {preview && <p role="status" className="flex items-center justify-center gap-2 bg-amber-100 p-2 text-center text-sm font-semibold text-amber-950"><Eye aria-hidden="true" className="size-4" /> {t('preview.banner')}</p>}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-3 focus:shadow">{t('skipLink')}</a>
      <Header />
      <main id="main" tabIndex={-1} className="page-enter flex-1 outline-none" key={pathname}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
