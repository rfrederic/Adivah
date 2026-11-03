import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';

export const securityHeaders = () =>
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        // L'aperçu du tableau de bord affiche le site dans un cadre : autorisé pour ce site uniquement.
        frameAncestors: ["'self'"],
        ...(env.SITE_URL.startsWith('https://') ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: env.SITE_URL.startsWith('https://') ? { maxAge: 15552000 } : false,
  });

/** Défense CSRF en complément des cookies SameSite=Strict. */
export function sameOriginOnly(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const { origin } = req.headers;
  if (origin && origin !== env.SITE_URL) throw new ApiError(403, 'forbidden');
  return next();
}

const limiter = (windowMinutes, limit, skipSuccessfulRequests = false) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new ApiError(429, 'rate_limited')),
  });

export const apiLimiter = () => limiter(15, 600);
export const loginLimiter = () => limiter(15, 10, true);
export const recoveryLimiter = () => limiter(15, 5);
export const submissionLimiter = () => limiter(60, 10);
