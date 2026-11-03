import { Schema, model } from 'mongoose';
import { ROLES, USER_STATUSES } from '../constants.js';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'editor' },
    status: { type: String, enum: USER_STATUSES, default: 'active' },
    // Incrémenté à chaque changement de mot de passe, de rôle ou de statut : invalide les sessions existantes.
    tokenVersion: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

export const User = model('User', userSchema);
