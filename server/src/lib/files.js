import { deleteUpload } from './storage.js';

export const UPLOAD_URL_PATTERN = /^\/uploads\/(images|documents)\/[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/;

/** Photographies livrées avec le site (client/public/images). Le nom est limité : pas de sous-dossier ni de « .. ». */
export const STATIC_IMAGE_PATTERN = /^\/images\/(?!.*\.\.)[\p{L}\p{N} ._'’-]+\.(jpe?g|png|webp)$/iu;

/** Supprime un fichier téléversé à partir de son URL. Ignore tout ce qui n'est pas une URL d'upload valide. */
export async function removeUpload(url) {
  if (!url || !UPLOAD_URL_PATTERN.test(url)) return;
  await deleteUpload(url.replace(/^\/uploads\//, ''));
}
