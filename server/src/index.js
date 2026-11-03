import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { createApp } from './app.js';
import { migrate } from './lib/migrate.js';
import { startScheduler } from './lib/workflow.js';

async function main() {
  await connectDb();
  await migrate();
  startScheduler();
  const server = createApp().listen(env.PORT, () => {
    console.log(`API ADIVAH prête sur http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
  const shutdown = () => server.close(() => disconnectDb().then(() => process.exit(0)));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Démarrage impossible :', err.message);
  process.exit(1);
});
