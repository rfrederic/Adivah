import crypto from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import sharp from 'sharp';
import { ApiError } from '../lib/errors.js';
import { saveUpload } from '../lib/storage.js';

const MAX_IMAGE_WIDTH = 2400;

// Sur Vercel, une requête ne peut pas dépasser 4,5 Mo : les envois y sont limités à 4 Mo.
const PLATFORM_MAX = process.env.VERCEL ? 4 * 1024 * 1024 : Infinity;
const KINDS = {
  image: { dir: 'images', maxBytes: Math.min(5 * 1024 * 1024, PLATFORM_MAX), types: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } },
  document: { dir: 'documents', maxBytes: Math.min(25 * 1024 * 1024, PLATFORM_MAX), types: { 'application/pdf': 'pdf' } },
};

export const receiveFile = (kind) => multer({ storage: multer.memoryStorage(), limits: { fileSize: KINDS[kind].maxBytes, files: 1 } }).single('file');

/**
 * Le type est déduit du contenu réel du fichier (et non du nom ou de l'en-tête envoyés par le client),
 * et le nom est généré aléatoirement. Les SVG et autres formats exécutables sont refusés.
 */
export async function storeFile(kind, file) {
  if (!file) throw new ApiError(400, 'upload_failed');
  const config = KINDS[kind];
  const detected = await fileTypeFromBuffer(file.buffer);
  const extension = detected && config.types[detected.mime];
  if (!extension) throw new ApiError(400, 'file_type');
  const stored = kind === 'image' ? await sanitizeImage(file.buffer, extension) : { buffer: file.buffer };
  const name = `${crypto.randomUUID()}.${extension}`;
  const url = await saveUpload(`${config.dir}/${name}`, stored.buffer, detected.mime);
  return { url, size: stored.buffer.length, width: stored.width ?? null, height: stored.height ?? null };
}

/**
 * Réencode chaque image : retire les métadonnées (position GPS, appareil, date) qui pourraient exposer
 * des personnes, redresse la photo et limite ses dimensions. Une image illisible est refusée.
 */
async function sanitizeImage(input, extension) {
  try {
    const pipeline = sharp(input).rotate().resize({ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH, fit: 'inside', withoutEnlargement: true });
    const encoded = extension === 'jpg' ? pipeline.jpeg({ quality: 85, mozjpeg: true }) : extension === 'png' ? pipeline.png() : pipeline.webp({ quality: 85 });
    const { data, info } = await encoded.toBuffer({ resolveWithObject: true });
    return { buffer: data, width: info.width, height: info.height };
  } catch {
    throw new ApiError(400, 'file_type');
  }
}
