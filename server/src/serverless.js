import { connectDb } from './config/db.js';
import { createApp } from './app.js';
import { migrate } from './lib/migrate.js';
import { publishDue } from './lib/workflow.js';

/**
 * Point d'entrée pour Vercel (fonction serverless) : pas de serveur permanent ni de minuterie.
 * - La connexion à MongoDB est ouverte une fois puis réutilisée tant que la fonction reste active.
 * - Les contenus programmés sont publiés au fil des visites (au plus une vérification par minute),
 *   et une tâche planifiée Vercel (/api/cron/publish) le fait aussi chaque jour.
 */
let ready;
let app;
let lastCheck = 0;

async function init() {
  await connectDb();
  await migrate();
  app = createApp();
}

export default async function handler(req, res) {
  try {
    ready ??= init();
    await ready;
  } catch (err) {
    ready = undefined;
    console.error(`Démarrage impossible : ${err.message}`);
    res.statusCode = 503;
    return res.end('Service temporairement indisponible');
  }
  if (Date.now() - lastCheck > 60 * 1000) {
    lastCheck = Date.now();
    await publishDue().catch((err) => console.error(`Publication programmée : ${err.message}`));
  }
  return app(req, res);
}
