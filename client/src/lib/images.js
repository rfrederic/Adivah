const WIDTHS = [480, 960, 1600];

/**
 * Versions allégées d'une photographie (créées par le serveur à partir de l'original, sans le copier).
 * Le navigateur choisit la plus adaptée à l'écran ; l'original reste disponible en plein écran.
 */
export function responsive(url, widths = WIDTHS) {
  if (!url || !/^\/(images|uploads\/images)\//.test(url) || url.startsWith('/images/brand/')) return { src: url };
  const version = (w) => `/img?w=${w}&src=${encodeURIComponent(url)}`;
  return { src: version(960), srcSet: widths.map((w) => `${version(w)} ${w}w`).join(', ') };
}
