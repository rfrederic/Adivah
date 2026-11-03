import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { Router } from 'express';
import { audit } from '../../lib/audit.js';
import { ApiError, notFound } from '../../lib/errors.js';
import { hashPassword } from '../../lib/password.js';
import { requirePermission } from '../../middleware/auth.js';
import { parse } from '../../middleware/validate.js';
import { User } from '../../models/User.js';
import { idParam, userCreate, userUpdate } from '../../validators/index.js';
import { sendPasswordLink } from '../auth.js';

const view = ({ _id, name, email, role, status, lastLoginAt, lockedUntil, createdAt }) => ({ _id, name, email, role, status, lastLoginAt, lockedUntil, createdAt });

/** Empêche de perdre tout accès d'administration. */
async function assertNotLastSuperAdmin(user) {
  if (user.role !== 'super_admin' || user.status !== 'active') return;
  const others = await User.countDocuments({ _id: mongoose.trusted({ $ne: user._id }), role: 'super_admin', status: 'active' });
  if (!others) throw new ApiError(409, 'last_super_admin');
}

export function userRoutes() {
  const router = Router();
  router.use(requirePermission('users.manage'));

  router.get('/', async (_req, res) => {
    const users = await User.find().sort({ name: 1 }).lean();
    res.json(users.map(view));
  });

  // Le mot de passe n'est jamais choisi ni vu par l'administrateur : la personne le définit via un lien à usage unique.
  router.post('/', async (req, res) => {
    const data = parse(userCreate, req.body);
    if (await User.exists({ email: data.email.toLowerCase() })) throw new ApiError(409, 'email_taken');
    const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
    const user = await User.create({ ...data, passwordHash });
    const emailSent = await sendPasswordLink(user, { invite: true });
    await audit(req.user, 'user.create', { type: 'user', id: user._id, label: user.email, details: `role: ${user.role}` });
    res.status(201).json({ user: view(user), emailSent });
  });

  router.patch('/:id', async (req, res) => {
    const data = parse(userUpdate, req.body);
    const user = await User.findById(parse(idParam, req.params).id);
    if (!user) throw notFound();
    const changesAccess = (data.role && data.role !== user.role) || (data.status && data.status !== user.status);
    if (changesAccess) {
      if (String(user._id) === String(req.user._id)) throw new ApiError(409, 'self_action');
      await assertNotLastSuperAdmin(user);
    }
    const previous = { role: user.role, status: user.status, name: user.name };
    user.set(data);
    if (changesAccess) user.tokenVersion += 1; // Les droits changent : la session en cours prend fin.
    if (data.status === 'active') {
      user.failedLogins = 0;
      user.lockedUntil = null;
    }
    await user.save();
    if (previous.role !== user.role) await audit(req.user, 'user.role_change', { type: 'user', id: user._id, label: user.email, details: `${previous.role} → ${user.role}` });
    if (previous.status !== user.status) await audit(req.user, user.status === 'suspended' ? 'user.suspend' : 'user.reactivate', { type: 'user', id: user._id, label: user.email });
    if (previous.name !== user.name) await audit(req.user, 'user.update', { type: 'user', id: user._id, label: user.email });
    res.json(view(user));
  });

  router.post('/:id/send-reset', async (req, res) => {
    const user = await User.findById(parse(idParam, req.params).id);
    if (!user) throw notFound();
    const emailSent = await sendPasswordLink(user);
    await audit(req.user, 'user.reset_sent', { type: 'user', id: user._id, label: user.email });
    res.json({ emailSent });
  });

  router.delete('/:id', async (req, res) => {
    const user = await User.findById(parse(idParam, req.params).id);
    if (!user) throw notFound();
    if (String(user._id) === String(req.user._id)) throw new ApiError(409, 'self_action');
    await assertNotLastSuperAdmin(user);
    await user.deleteOne();
    await audit(req.user, 'user.delete', { type: 'user', id: user._id, label: user.email });
    res.status(204).end();
  });

  return router;
}
