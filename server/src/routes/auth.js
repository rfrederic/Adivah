import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { env } from '../config/env.js';
import { audit } from '../lib/audit.js';
import { ApiError } from '../lib/errors.js';
import { background, sendMail } from '../lib/mail.js';
import { BCRYPT_COST, createToken, hashPassword, hashToken, isStrongPassword } from '../lib/password.js';
import { permissionsOf } from '../lib/permissions.js';
import { endSession, requireAuth, sessionUser, startSession } from '../middleware/auth.js';
import { loginLimiter, recoveryLimiter, sameOriginOnly } from '../middleware/security.js';
import { parse } from '../middleware/validate.js';
import { User } from '../models/User.js';
import { forgotInput, loginInput, passwordChange, resetInput } from '../validators/index.js';

export { BCRYPT_COST };
// Compare toujours un hash : la durée de réponse ne révèle pas si le compte existe.
const DUMMY_HASH = bcrypt.hashSync('adivah-compte-inexistant', BCRYPT_COST);

export const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const RESET_MINUTES = 60;
const INVITE_HOURS = 72;

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, permissions: permissionsOf(u.role) });

/** Prépare un lien à usage unique et l'envoie. Le jeton n'existe en clair que dans l'e-mail. */
export async function sendPasswordLink(user, { invite = false } = {}) {
  const { token, hash } = createToken();
  const minutes = invite ? INVITE_HOURS * 60 : RESET_MINUTES;
  await User.updateOne({ _id: user._id }, { resetTokenHash: hash, resetTokenExpires: new Date(Date.now() + minutes * 60000) });
  const link = `${env.SITE_URL}/admin/reset-password?token=${token}`;
  const duration = invite ? `${INVITE_HOURS} h` : `${RESET_MINUTES} min`;
  const text = invite
    ? `Un compte d'administration ADIVAH a été créé pour vous. Choisissez votre mot de passe (lien valable ${duration}) :\n${link}\n\n---\nAn ADIVAH administration account has been created for you. Choose your password (link valid for ${duration}):\n${link}`
    : `Une réinitialisation de votre mot de passe ADIVAH a été demandée. Lien valable ${duration} :\n${link}\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n---\nA password reset was requested for your ADIVAH account. Link valid for ${duration}:\n${link}\nIf you did not request this, ignore this message.`;
  return sendMail({ to: user.email, subject: invite ? 'ADIVAH : votre compte / your account' : 'ADIVAH : mot de passe / password reset', text });
}

export function authRoutes() {
  const router = Router();
  router.use(sameOriginOnly);

  router.post('/login', loginLimiter(), async (req, res) => {
    const { email, password } = parse(loginInput, req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    const locked = user?.lockedUntil && user.lockedUntil > new Date();
    // Compte inconnu, verrouillé ou suspendu : même réponse, pour ne rien révéler.
    if (!user || !valid || locked || user.status !== 'active') {
      if (user) {
        if (!valid && !locked) {
          user.failedLogins += 1;
          if (user.failedLogins >= MAX_FAILED_LOGINS) {
            user.failedLogins = 0;
            user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
            await audit(user, 'account_locked', { type: 'user', id: user._id, label: user.email });
            await background(sendMail({
              to: user.email,
              subject: 'ADIVAH : compte verrouillé / account locked',
              text: `Après plusieurs tentatives échouées, votre compte est verrouillé pendant ${LOCK_MINUTES} minutes.\n\n---\nAfter several failed attempts, your account is locked for ${LOCK_MINUTES} minutes.`,
            }));
          }
          await user.save();
        }
        await audit(user, 'login_failed', { type: 'user', id: user._id, label: user.email });
      }
      throw new ApiError(401, 'invalid_credentials');
    }
    user.failedLogins = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();
    startSession(res, user);
    await audit(user, 'login', { type: 'user', id: user._id, label: user.email });
    res.json(publicUser(user));
  });

  router.post('/logout', async (req, res) => {
    const user = await sessionUser(req);
    if (user) await audit(user, 'logout', { type: 'user', id: user._id, label: user.email });
    endSession(res);
    res.json({ ok: true });
  });

  router.get('/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

  router.post('/change-password', loginLimiter(), requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = parse(passwordChange, req.body);
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new ApiError(400, 'wrong_password');
    if (!isStrongPassword(newPassword, user)) throw new ApiError(400, 'weak_password');
    user.passwordHash = await hashPassword(newPassword);
    user.tokenVersion += 1;
    await user.save();
    startSession(res, user);
    await audit(user, 'password_changed', { type: 'user', id: user._id, label: user.email });
    res.json({ ok: true });
  });

  // Réponse identique que le compte existe ou non.
  router.post('/forgot-password', recoveryLimiter(), async (req, res) => {
    const { email } = parse(forgotInput, req.body);
    const user = await User.findOne({ email: email.toLowerCase(), status: 'active' });
    if (user) {
      await background(sendPasswordLink(user));
      await audit(user, 'password_reset_requested', { type: 'user', id: user._id, label: user.email });
    }
    res.json({ ok: true });
  });

  router.post('/reset-password', recoveryLimiter(), async (req, res) => {
    const { token, newPassword } = parse(resetInput, req.body);
    const user = await User.findOne({ resetTokenHash: hashToken(token), resetTokenExpires: mongoose.trusted({ $gt: new Date() }), status: 'active' });
    if (!user) throw new ApiError(400, 'invalid_token');
    if (!isStrongPassword(newPassword, user)) throw new ApiError(400, 'weak_password');
    await User.updateOne(
      { _id: user._id },
      { passwordHash: await hashPassword(newPassword), resetTokenHash: null, resetTokenExpires: null, failedLogins: 0, lockedUntil: null, $inc: { tokenVersion: 1 } },
    );
    await audit(user, 'password_reset', { type: 'user', id: user._id, label: user.email });
    res.json({ ok: true });
  });

  return router;
}
