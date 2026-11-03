import { AuditLog } from '../models/AuditLog.js';

export const SYSTEM_ACTOR = { name: 'Système', email: '', role: 'system' };

/** Enregistre une action. Une panne du journal n'interrompt pas l'action, mais elle est signalée. */
export async function audit(actor, action, { type = '', id = null, label = '', details = '' } = {}) {
  try {
    await AuditLog.create({
      actorId: actor?._id ?? null,
      actorName: actor?.name ?? '',
      actorEmail: actor?.email ?? '',
      actorRole: actor?.role ?? '',
      action,
      targetType: type,
      targetId: id ? String(id) : '',
      targetLabel: String(label).slice(0, 200),
      details: String(details).slice(0, 1000),
    });
  } catch (err) {
    console.error(`Journal d'audit indisponible : ${action} (${err.message})`);
  }
}

/** Liste les champs modifiés, sans leur contenu : le journal ne duplique pas les données. */
export function changedFields(before, after) {
  const value = (v) => JSON.stringify(v ?? null);
  return Object.keys(after).filter((k) => value(before?.[k]) !== value(after[k]));
}
