import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '@/context/SettingsContext';
import { storeLang, switchPath } from '@/lib/routes';

/** Sélecteur FR | EN : conserve la page et les filtres en cours. */
export function LanguageSwitcher({ inAdmin = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const { settings } = useSettings();

  if (!inAdmin && settings?.englishEnabled === false) return null;

  const choose = (lang) => {
    if (lang === i18n.language) return;
    storeLang(lang);
    i18n.changeLanguage(lang);
    if (!inAdmin) navigate(switchPath(pathname, lang) + search + hash);
  };

  return (
    <div role="group" aria-label={t('nav.language')} className="flex items-center text-sm font-semibold">
      {['fr', 'en'].map((lang, index) => (
        <span key={lang} className="flex items-center">
          {index > 0 && <span aria-hidden="true" className="px-0.5 text-slate-400">|</span>}
          <button
            type="button"
            lang={lang}
            aria-pressed={i18n.language === lang}
            aria-label={t(lang === 'fr' ? 'nav.switchToFr' : 'nav.switchToEn')}
            onClick={() => choose(lang)}
            className={`cursor-pointer inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2 transition-colors ${i18n.language === lang ? 'bg-sky-100 text-sky-900' : 'text-ink-soft hover:text-sky-800'}`}
          >
            {lang.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
