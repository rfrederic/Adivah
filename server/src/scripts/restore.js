// Restauration : REMPLACE la base indiquée par MONGODB_URI et le dossier des fichiers téléversés.
//   npm run restore -- --file=/chemin/adivah-….backup --yes
// Sans --yes, le script vérifie seulement le fichier et affiche son contenu, sans rien modifier.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { decrypt, requireKey } from './backupCrypto.js';

const { EJSON } = mongoose.mongo.BSON;
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=') || true];
}));

async function main() {
  if (typeof args.file !== 'string') throw new Error('Usage : npm run restore -- --file=/chemin/adivah-….backup [--yes]');
  const key = requireKey();
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'adivah-restore-'));
  try {
    const tarball = path.join(work, 'backup.tar.gz');
    // L'authenticité est vérifiée pendant le déchiffrement : un fichier altéré ou une mauvaise clé échoue ici.
    await decrypt(args.file, tarball, key);
    execFileSync('tar', ['-xzf', tarball, '-C', work]);
    const manifest = JSON.parse(await fs.readFile(path.join(work, 'manifest.json'), 'utf8'));
    console.log(`Sauvegarde du ${manifest.createdAt}`, manifest.counts);
    if (!args.yes) {
      console.log('Fichier valide. Rien n\'a été modifié. Ajoutez --yes pour restaurer.');
      return;
    }
    await connectDb();
    const { db } = mongoose.connection;
    for (const file of await fs.readdir(path.join(work, 'db'))) {
      const name = path.basename(file, '.json');
      const docs = EJSON.parse(await fs.readFile(path.join(work, 'db', file), 'utf8'), { relaxed: false });
      await db.collection(name).deleteMany({});
      if (docs.length) await db.collection(name).insertMany(docs);
    }
    await fs.rm(env.UPLOAD_DIR, { recursive: true, force: true });
    await fs.cp(path.join(work, 'uploads'), env.UPLOAD_DIR, { recursive: true });
    console.log('Restauration terminée. Redémarrez l\'application.');
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
}

main()
  .catch((err) => {
    console.error(`Restauration impossible : ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
