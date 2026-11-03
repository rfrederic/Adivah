import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Router } from 'express';
import sharp from 'sharp';
import { env, serverRoot } from '../config/env.js';
import { STATIC_IMAGE_PATTERN, UPLOAD_URL_PATTERN } from './files.js';

export const RESIZE_WIDTHS = [320, 480, 640, 960, 1280, 1600];
const CACHE_DIR = path.join(os.tmpdir(), 'adivah-image-cache');
const STATIC_DIRS = [path.resolve(serverRoot, '../client/public/images'), path.resolve(serverRoot, '../client/dist/images')];

/** Trouve le fichier d'origine sans jamais sortir des dossiers d'images autorisés. */
async function sourceFile(src) {
  if (STATIC_IMAGE_PATTERN.test(src)) {
    const name = src.slice('/images/'.length);
    for (const dir of STATIC_DIRS) {
      const file = path.join(dir, name);
      if (path.dirname(file) === dir && (await fs.stat(file).catch(() => null))?.isFile()) return file;
    }
    return null;
  }
  if (UPLOAD_URL_PATTERN.test(src) && src.startsWith('/uploads/images/')) {
    const file = path.join(env.UPLOAD_DIR, src.slice('/uploads/'.length));
    return (await fs.stat(file).catch(() => null))?.isFile() ? file : null;
  }
  return null;
}

/**
 * Versions allégées des photographies, créées à la demande puis gardées en cache.
 * Les originaux ne sont ni copiés ni modifiés ; les métadonnées sont retirées des versions servies.
 */
export function imageRoutes() {
  const router = Router();
  router.get('/img', async (req, res) => {
    const width = Number(req.query.w);
    const src = typeof req.query.src === 'string' ? req.query.src : '';
    if (!RESIZE_WIDTHS.includes(width)) return res.status(400).end();
    const file = await sourceFile(src);
    if (!file) return res.status(404).end();
    const { mtimeMs } = await fs.stat(file);
    const key = crypto.createHash('sha1').update(`${file}|${mtimeMs}|${width}`).digest('hex');
    const cached = path.join(CACHE_DIR, `${key}.webp`);
    let data = await fs.readFile(cached).catch(() => null);
    if (!data) {
      try {
        data = await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      } catch {
        return res.status(415).end();
      }
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(cached, data).catch(() => {});
    }
    return res.type('image/webp').set('Cache-Control', 'public, max-age=86400').set('X-Content-Type-Options', 'nosniff').send(data);
  });
  return router;
}
