import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { langFromPath, readStoredLang } from '@/lib/routes';
import en from './locales/en.json';
import fr from './locales/fr.json';

const { pathname } = window.location;
const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: isAdmin ? readStoredLang() || 'fr' : langFromPath(pathname),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;
