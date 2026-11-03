import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import morgan from 'morgan';
import { env, serverRoot } from './config/env.js';
import { apiNotFound, errorHandler } from './middleware/errors.js';
import { apiLimiter, securityHeaders } from './middleware/security.js';
import { adminRoutes } from './routes/admin/index.js';
import { imageRoutes } from './lib/imageResize.js';
import { authRoutes } from './routes/auth.js';
import { publicRoutes } from './routes/public.js';
import { renderIndex, robotsTxt, sitemapXml } from './seo/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(securityHeaders());
  app.use(compression());
  // Format sans adresse IP : voir la page Confidentialité.
  if (!env.isTest) app.use(morgan('tiny'));

  // Fichiers téléversés : jamais interprétés par le navigateur comme du contenu actif.
  app.use(
    '/uploads',
    express.static(env.UPLOAD_DIR, {
      index: false,
      dotfiles: 'deny',
      maxAge: '30d',
      immutable: true,
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );

  app.use(imageRoutes());
  app.get('/robots.txt', robotsTxt);
  app.get('/sitemap.xml', sitemapXml);

  app.use('/api', apiLimiter(), cookieParser(), express.json({ limit: '200kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes());
  app.use('/api/admin', adminRoutes());
  app.use('/api', publicRoutes());
  app.use('/api', apiNotFound);

  // En production, Express sert aussi le site React : une seule application à déployer.
  const dist = path.resolve(serverRoot, '../client/dist');
  const indexPath = path.join(dist, 'index.html');
  if (fs.existsSync(indexPath)) {
    app.use(express.static(dist, { index: false, maxAge: '1y', immutable: true, setHeaders: (res, file) => {
      if (!file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=3600');
    } }));
    app.get('/{*path}', renderIndex(indexPath));
  }

  app.use(errorHandler);
  return app;
}
