import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export const BCRYPT_COST = 12;
export const MIN_PASSWORD_LENGTH = 12;

/** Renvoie true si le mot de passe respecte les règles : longueur, minuscule, majuscule, chiffre, et sans le nom ou l'e-mail. */
export function isStrongPassword(password, { email = '', name = '' } = {}) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > 200) return false;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return false;
  const lower = password.toLowerCase();
  const personal = [email.split('@')[0], ...name.split(/\s+/)].map((p) => p.toLowerCase()).filter((p) => p.length >= 4);
  return !personal.some((p) => lower.includes(p));
}

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_COST);

/** Jeton à usage unique : seul son empreinte est conservée en base, jamais le jeton lui-même. */
export function createToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}
export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
