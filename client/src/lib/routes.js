import site from '@shared/site.json';

export const LANGS = ['fr', 'en'];
export const routes = site.routes;
const STORAGE_KEY = 'adivah.lang';

export const langFromPath = (pathname) => (pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fr');
export const routePath = (key, lang) => routes[key][lang];

export function readStoredLang() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Stockage indisponible (navigation privée) : le choix reste valable grâce à l'URL.
  }
}

/** Donne l'URL équivalente dans l'autre langue, y compris pour les pages de détail. */
export function switchPath(pathname, target) {
  const current = langFromPath(pathname);
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  for (const paths of Object.values(routes)) {
    if (paths[current] === clean) return paths[target];
    if (paths !== routes.home && clean.startsWith(`${paths[current]}/`)) {
      return paths[target] + clean.slice(paths[current].length);
    }
  }
  return routes.home[target];
}

/** Au chargement, applique la langue préférée du visiteur. Le français reste la langue par défaut. */
/** Aperçu ouvert depuis le tableau de bord : ne change ni la langue enregistrée, ni le contenu public. */
export const isPreviewMode = () => /[?&](preview=1|previewId=)/.test(window.location.search);

export function applyStoredLanguage() {
  if (isPreviewMode()) return;
  const { pathname, search, hash } = window.location;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return;
  const stored = readStoredLang();
  if (stored && stored !== langFromPath(pathname)) {
    window.history.replaceState(null, '', switchPath(pathname, stored) + search + hash);
  }
}
