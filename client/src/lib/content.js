/** Retourne le texte dans la langue demandée, ou en français si la traduction n'a pas encore été saisie. */
export const pick = (field, lang) => field?.[lang] || field?.fr || '';

export const paragraphs = (text) => (text ? text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : []);
export const lines = (text) => (text ? text.split('\n').map((l) => l.trim()).filter(Boolean) : []);

export function formatDate(value, lang) {
  if (!value) return '';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value));
}

/** Date d'une activité selon sa précision : jamais un jour inventé quand seul le mois ou l'année est connu. */
export function formatPartialDate(value, precision, lang) {
  if (!value) return '';
  const date = new Date(value);
  if (precision === 'year') return String(date.getUTCFullYear());
  if (precision === 'month') {
    const text = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return formatDate(value, lang);
}

export function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} Mo` : `${Math.ceil(bytes / 1024)} Ko`;
}
