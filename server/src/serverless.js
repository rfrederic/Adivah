/**
 * Point d'entrée pour Vercel (fonction serverless) : pas de serveur permanent ni de minuterie.
 * - La connexion à MongoDB est ouverte une fois puis réutilisée tant que la fonction reste active.
 * - Les contenus programmés sont publiés au fil des visites (au plus une vérification par minute),
 *   et une tâche planifiée Vercel (/api/cron/publish) le fait aussi chaque jour.
 * - Les modules sont chargés ici (et non au début du fichier) pour qu'une erreur de configuration
 *   produise un message clair au lieu d'un arrêt de la fonction.
 */
let ready;
let app;
let publishDue;
let lastCheck = 0;

async function init() {
  const { connectDb } = await import('./config/db.js');
  const { createApp } = await import('./app.js');
  const { migrate } = await import('./lib/migrate.js');
  ({ publishDue } = await import('./lib/workflow.js'));
  try {
    await connectDb();
  } catch (err) {
    const error = new Error('database');
    error.cause = err;
    throw error;
  }
  await migrate();
  app = createApp();
}

function explain(err) {
  if (err.message === 'invalid_config') {
    return `Configuration invalide. Vérifiez ces variables dans Vercel (Settings → Environment Variables), puis redéployez :\n\n- ${err.settings.join('\n- ')}`;
  }
  if (err.message === 'database') {
    return 'Connexion à la base de données impossible. Vérifiez MONGODB_URI (utilisateur et mot de passe) et, dans MongoDB Atlas, Network Access : 0.0.0.0/0.';
  }
  return `Service temporairement indisponible.\n\nErreur : ${String(err.message).split('\n')[0].slice(0, 300)}`;
}

export default async function handler(req, res) {
  try {
    ready ??= init();
    await ready;
  } catch (err) {
    ready = undefined;
    console.error('Démarrage impossible :', err.message, err.settings ?? '', err.cause?.message ?? '', err.stack ?? '');
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(explain(err));
  }
  if (Date.now() - lastCheck > 60 * 1000) {
    lastCheck = Date.now();
    await publishDue().catch((err) => console.error(`Publication programmée : ${err.message}`));
  }
  return app(req, res);
}
