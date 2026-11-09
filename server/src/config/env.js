import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const here = path.dirname(fileURLToPath(import.meta.url));
export const serverRoot = path.resolve(here, '../..');

dotenv.config({ path: path.join(serverRoot, '.env'), quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit contenir au moins 32 caractères'),
  SITE_URL: z.string().url().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  UPLOAD_DIR: z.string().default(path.join(serverRoot, 'uploads')),
  // E-mail : sans SMTP_HOST, aucune notification n'est envoyée (le site continue de fonctionner).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  // Sauvegardes chiffrées
  BACKUP_DIR: z.string().default(path.join(serverRoot, '..', '..', 'adivah-backups')),
  BACKUP_KEY: z.string().optional(),
  BACKUP_KEEP: z.coerce.number().int().positive().default(14),
  // Vercel : secret de la tâche planifiée (fourni automatiquement à /api/cron/publish par Vercel).
  CRON_SECRET: z.string().min(16).optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Configuration invalide (voir server/.env.example) :\n${details}`);
  // Sur Vercel, on signale l'erreur au lieu d'arrêter la fonction (seuls les noms des réglages sont indiqués).
  if (process.env.VERCEL) {
    const error = new Error('invalid_config');
    error.settings = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw error;
  }
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && !parsed.data.SITE_URL.startsWith('https://')) {
  console.warn('Attention : SITE_URL n\'est pas en HTTPS. Les cookies de session ne seront pas protégés (Secure).');
}

export const env = {
  ...parsed.data,
  SITE_URL: parsed.data.SITE_URL.replace(/\/$/, ''),
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
};
