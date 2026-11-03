// Sauvegarde chiffrée : base de données (tous les contenus, comptes, paramètres et journal) et fichiers téléversés.
//   npm run backup
// Nécessite BACKUP_KEY (32 caractères minimum). Le fichier .env n'est pas inclus : conservez-le à part.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../config/db.js';
import { env, serverRoot } from '../config/env.js';
import { assertSafeBackupDir, encrypt, requireKey } from './backupCrypto.js';

const { EJSON } = mongoose.mongo.BSON;

async function main() {
  const key = requireKey();
  await assertSafeBackupDir(env.BACKUP_DIR, [env.UPLOAD_DIR, serverRoot]);
  await connectDb();
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'adivah-backup-'));
  try {
    const dbDir = path.join(work, 'db');
    await fs.mkdir(dbDir);
    const { db } = mongoose.connection;
    const counts = {};
    for (const { name } of await db.listCollections({ type: 'collection' }).toArray()) {
      const docs = await db.collection(name).find().toArray();
      counts[name] = docs.length;
      await fs.writeFile(path.join(dbDir, `${name}.json`), EJSON.stringify(docs, { relaxed: false }));
    }
    await fs.cp(env.UPLOAD_DIR, path.join(work, 'uploads'), { recursive: true });
    await fs.writeFile(path.join(work, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), counts }, null, 2));

    const tarball = path.join(work, '..', `${path.basename(work)}.tar.gz`);
    execFileSync('tar', ['-czf', tarball, '-C', work, 'db', 'uploads', 'manifest.json']);
    await fs.mkdir(env.BACKUP_DIR, { recursive: true, mode: 0o700 });
    await fs.chmod(env.BACKUP_DIR, 0o700);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const target = path.join(env.BACKUP_DIR, `adivah-${stamp}.backup`);
    await encrypt(tarball, target, key);
    await fs.chmod(target, 0o600);
    await fs.rm(tarball, { force: true });

    const existing = (await fs.readdir(env.BACKUP_DIR)).filter((f) => /^adivah-.*\.backup$/.test(f)).sort();
    const outdated = existing.slice(0, Math.max(0, existing.length - env.BACKUP_KEEP));
    await Promise.all(outdated.map((f) => fs.rm(path.join(env.BACKUP_DIR, f))));
    console.log(`Sauvegarde créée : ${target}`);
    console.log(counts);
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
}

main()
  .catch((err) => {
    console.error(`Sauvegarde impossible : ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
