import crypto from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { env } from '../config/env.js';

const MAGIC = Buffer.from('ADIVAHB1');
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

export function requireKey() {
  if (!env.BACKUP_KEY || env.BACKUP_KEY.length < 32) throw new Error('BACKUP_KEY doit contenir au moins 32 caractères (voir docs/DEPLOYMENT.md).');
  return env.BACKUP_KEY;
}

/** Refuse un dossier de sauvegarde accessible par le site web ou situé dans l'application. */
export async function assertSafeBackupDir(dir, forbidden) {
  const resolved = path.resolve(dir);
  for (const f of forbidden) {
    const root = path.resolve(f);
    if (resolved === root || resolved.startsWith(`${root}${path.sep}`)) throw new Error(`BACKUP_DIR ne doit pas se trouver dans ${root}.`);
  }
}

const derive = (key, salt) => crypto.scryptSync(key, salt, 32);

/** Format : MAGIC | sel | IV | données chiffrées AES-256-GCM | étiquette d'authenticité. */
export async function encrypt(source, target, key) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', derive(key, salt), iv);
  await fs.writeFile(target, Buffer.concat([MAGIC, salt, iv]), { mode: 0o600 });
  await pipeline(createReadStream(source), cipher, createWriteStream(target, { flags: 'a' }));
  await fs.appendFile(target, cipher.getAuthTag());
}

export async function decrypt(source, target, key) {
  const { size } = await fs.stat(source);
  const headerLength = MAGIC.length + SALT_LENGTH + IV_LENGTH;
  if (size < headerLength + TAG_LENGTH) throw new Error('Fichier de sauvegarde invalide.');
  const handle = await fs.open(source);
  const header = Buffer.alloc(headerLength);
  const tag = Buffer.alloc(TAG_LENGTH);
  await handle.read(header, 0, headerLength, 0);
  await handle.read(tag, 0, TAG_LENGTH, size - TAG_LENGTH);
  await handle.close();
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Fichier de sauvegarde invalide.');
  const salt = header.subarray(MAGIC.length, MAGIC.length + SALT_LENGTH);
  const iv = header.subarray(MAGIC.length + SALT_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-gcm', derive(key, salt), iv);
  decipher.setAuthTag(tag);
  await pipeline(createReadStream(source, { start: headerLength, end: size - TAG_LENGTH - 1 }), decipher, createWriteStream(target, { mode: 0o600 }));
}
