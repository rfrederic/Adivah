import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';

const MAX_IMAGE_WIDTH = 2400;

const KINDS = {
  image: { dir: 'images', maxBytes: 5 * 1024 * 1024, types: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } },
  document: { dir: 'documents', maxBytes: 25 * 1024 * 1024, types: { 'application/pdf': 'pdf' } },
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
  const dir = path.join(env.UPLOAD_DIR, config.dir);
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(dir, name), stored.buffer, { flag: 'wx', mode: 0o644 });
  return { url: `/uploads/${config.dir}/${name}`, size: stored.buffer.length, width: stored.width ?? null, height: stored.height ?? null };
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
