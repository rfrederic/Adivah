import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import { can } from '../lib/permissions.js';
import { User } from '../models/User.js';

export const COOKIE_NAME = 'adivah_session';
const SESSION_HOURS = 8;

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: env.isProd && env.SITE_URL.startsWith('https://'),
  path: '/api',
});

export function startSession(res, user) {
  const token = jwt.sign({ sub: String(user._id), v: user.tokenVersion }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${SESSION_HOURS}h`,
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: SESSION_HOURS * 3600 * 1000 });
}

export const endSession = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

/** Renvoie l'utilisateur d'une session valide, ou null. */
export async function sessionUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.v || user.status !== 'active') return null;
  return user;
}

export async function requireAuth(req, _res, next) {
  const user = await sessionUser(req);
  if (!user) throw new ApiError(401, 'unauthorized');
  req.user = user;
  next();
}

export const requirePermission = (permission) => (req, _res, next) => {
  if (!can(req.user?.role, permission)) throw new ApiError(403, 'forbidden');
  next();
};
