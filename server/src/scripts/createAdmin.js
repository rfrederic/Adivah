// Crée ou réinitialise un compte du tableau de bord.
//   npm run create-admin -- --email=vous@exemple.org --name="Votre nom" [--role=super_admin|content_admin|editor|viewer]
// Le mot de passe est demandé dans le terminal (ou lu dans ADMIN_PASSWORD pour un déploiement automatisé).
import readline from 'node:readline/promises';
import { connectDb, disconnectDb } from '../config/db.js';
import { ROLES } from '../constants.js';
import { User } from '../models/User.js';
import { hashPassword, isStrongPassword } from '../lib/password.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=')];
  }),
);

async function promptPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Mot de passe (12 caractères minimum, minuscule, majuscule et chiffre) : ');
  rl.close();
  return answer;
}

async function main() {
  const { email, name, role = 'super_admin' } = args;
  if (!email || !name || !ROLES.includes(role)) {
    throw new Error('Usage : npm run create-admin -- --email=vous@exemple.org --name="Votre nom" [--role=super_admin|content_admin|editor|viewer]');
  }
  const password = await promptPassword();
  if (!isStrongPassword(password, { email, name })) throw new Error('Mot de passe trop faible : 12 caractères minimum, avec minuscule, majuscule et chiffre, sans votre nom ni votre e-mail.');
  await connectDb();
  const passwordHash = await hashPassword(password);
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { name, role, passwordHash, status: 'active', failedLogins: 0, lockedUntil: null, $inc: { tokenVersion: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  console.log(`Compte prêt : ${user.email} (${user.role})`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
