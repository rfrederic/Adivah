import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

/**
 * Stockage des fichiers téléversés.
 * - En local (ou sur un serveur avec disque) : dossier UPLOAD_DIR.
 * - Sur Vercel (BLOB_READ_WRITE_TOKEN défini) : Vercel Blob, car le disque des fonctions n'est pas conservé.
 * Dans les deux cas, l'adresse enregistrée reste « /uploads/<dossier>/<nom> » : la base de données
 * et le site ne dépendent pas du mode de stockage.
 */
export const usesBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

let blobSdk;
const blob = async () => (blobSdk ??= await import('@vercel/blob'));

/** relative = « images/<uuid>.jpg » ; renvoie l'adresse publique « /uploads/images/<uuid>.jpg ». */
export async function saveUpload(relative, buffer, contentType) {
  if (usesBlob) {
    const { put } = await blob();
    await put(`uploads/${relative}`, buffer, { access: 'public', contentType, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
  } else {
    const file = path.join(env.UPLOAD_DIR, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buffer, { flag: 'wx', mode: 0o644 });
  }
  return `/uploads/${relative}`;
}

export async function deleteUpload(relative) {
  if (usesBlob) {
    const { del } = await blob();
    const info = await blobInfo(relative);
    if (info) await del(info.url);
  } else {
    await fs.rm(path.join(env.UPLOAD_DIR, relative), { force: true });
  }
}

/** Adresse publique et date d'un fichier dans Vercel Blob, ou null s'il n'existe pas. */
export async function blobInfo(relative) {
  const { head } = await blob();
  try {
    const info = await head(`uploads/${relative}`);
    return { url: info.url, version: new Date(info.uploadedAt).getTime() };
  } catch {
    return null;
  }
}
