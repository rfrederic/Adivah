import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/** En test, les messages sont conservés en mémoire pour vérification. */
export const testOutbox = [];

let transport;
function getTransport() {
  if (transport !== undefined) return transport;
  if (env.isTest) transport = nodemailer.createTransport({ jsonTransport: true });
  else if (env.SMTP_HOST) {
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  } else transport = null;
  return transport;
}

export const mailStatus = () => ({
  configured: Boolean(env.SMTP_HOST),
  host: env.SMTP_HOST ?? '',
  port: env.SMTP_HOST ? env.SMTP_PORT : null,
  from: env.MAIL_FROM ?? '',
});

/** Lance un envoi sans faire attendre la réponse (et sans révéler par le délai si un compte existe). Attendu en test uniquement. */
export const background = (promise) => (env.isTest ? promise : void promise.catch(() => {}));

/** N'interrompt jamais l'action en cours : renvoie false si l'envoi échoue. Le contenu n'est jamais journalisé. */
export async function sendMail({ to, subject, text }) {
  const recipients = [...new Set([to].flat().filter(Boolean))];
  if (!recipients.length) return false;
  if (env.isTest) testOutbox.push({ to: recipients, subject, text });
  const mailer = getTransport();
  if (!mailer) return false;
  try {
    await mailer.sendMail({ from: env.MAIL_FROM || env.SMTP_USER || 'ADIVAH <no-reply@localhost>', to: recipients, subject, text });
    return true;
  } catch (err) {
    console.error(`Envoi d'e-mail impossible (${err.code ?? 'erreur'})`);
    return false;
  }
}
