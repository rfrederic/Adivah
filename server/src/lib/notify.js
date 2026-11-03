import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { PERMISSIONS } from './permissions.js';
import { background, sendMail } from './mail.js';
import { labelOf } from './content.js';
import { getSettings } from '../models/Settings.js';
import { User } from '../models/User.js';

const emailsWithPermission = async (permission) =>
  (await User.find({ role: mongoose.trusted({ $in: PERMISSIONS[permission] }), status: 'active' }).select('email').lean()).map((u) => u.email);

const emailOf = async (actor) => (actor?.id ? (await User.findById(actor.id).select('email status').lean()) : null);

const link = (resource, id) => `${env.SITE_URL}/admin/${resource}/${id}`;

/** Le texte du message n'est jamais copié dans l'e-mail : il peut contenir des informations sensibles. */
export function notifyNewMessage(submission) {
  return background(
    (async () => {
      const settings = await getSettings();
      const to = settings.notificationEmail || (await emailsWithPermission('messages.manage'));
      return sendMail({
        to,
        subject: 'ADIVAH : nouveau message / new message',
        text: `Un nouveau message (${submission.type}) a été reçu. Connectez-vous pour le lire :\n${env.SITE_URL}/admin/messages\n\n---\nA new message (${submission.type}) has arrived. Sign in to read it:\n${env.SITE_URL}/admin/messages`,
      });
    })(),
  );
}

const TEXT = {
  submit: ['à valider', 'awaiting approval'],
  approve: ['approuvé', 'approved'],
  reject: ['refusé', 'rejected'],
  publish: ['publié', 'published'],
};

/** Prévient les bonnes personnes à chaque étape du circuit de validation. */
export function notifyWorkflow(action, resource, item, comment = '') {
  if (!TEXT[action]) return undefined;
  return background(
    (async () => {
      const authors = await Promise.all([emailOf(item.createdBy), emailOf(item.submittedBy)]);
      const authorEmails = authors.filter((a) => a && a.status === 'active').map((a) => a.email);
      const to = action === 'submit' ? await emailsWithPermission('content.review') : authorEmails;
      const [fr, en] = TEXT[action];
      const label = labelOf(item);
      const note = comment ? `\n\nCommentaire / Comment :\n${comment}` : '';
      return sendMail({
        to,
        subject: `ADIVAH : « ${label} » ${fr} / ${en}`,
        text: `Le contenu « ${label} » est ${fr}.\n\nThe item "${label}" is ${en}.${note}\n\n${link(resource, item._id)}`,
      });
    })(),
  );
}
