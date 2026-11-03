import i18n from 'i18next';
import site from '@shared/site.json';
import en from '@/i18n/locales/en.json';
import fr from '@/i18n/locales/fr.json';
import { LANGS } from './routes';

// Copie : i18next modifie ses ressources, alors que les textes d'origine doivent rester disponibles.
const BASE = { fr: structuredClone(fr), en: structuredClone(en) };
export const EDITABLE_KEYS = Object.values(site.editableText).flat();

export const baseText = (lang, key) => key.split('.').reduce((node, part) => node?.[part], BASE[lang]);

/** Applique les textes modifiés depuis le tableau de bord. Un champ vide rétablit le texte d'origine. */
export function applyOverrides(overrides) {
  for (const lang of LANGS) {
    for (const key of EDITABLE_KEYS) {
      const base = baseText(lang, key);
      const custom = overrides?.[lang]?.[key];
      const value = !custom ? base : Array.isArray(base) ? custom.split('\n').map((l) => l.trim()).filter(Boolean) : custom;
      i18n.addResource(lang, 'translation', key, value, { silent: true });
    }
  }
  i18n.emit('languageChanged', i18n.language);
}
