// Après « npm run build » sur Vercel : la page index.html est retirée des fichiers publics et confiée
// au serveur, qui y ajoute le titre, la description et l'image de partage propres à chaque page.
import fs from 'node:fs';

const from = 'client/dist/index.html';
const to = 'server/vercel-template/index.html';
fs.mkdirSync('server/vercel-template', { recursive: true });
fs.renameSync(from, to);
console.log(`Gabarit déplacé : ${from} -> ${to}`);
