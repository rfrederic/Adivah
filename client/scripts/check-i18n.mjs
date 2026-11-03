// Vérifie que le français et l'anglais contiennent exactement les mêmes clés, sans valeur vide.
import fs from 'node:fs';

const load = (l) => JSON.parse(fs.readFileSync(new URL(`../src/i18n/locales/${l}.json`, import.meta.url), 'utf8'));
const flatten = (o, prefix = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' && !Array.isArray(v) ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]],
  );
const fr = new Map(flatten(load('fr')));
const en = new Map(flatten(load('en')));
const problems = [
  ...[...fr.keys()].filter((k) => !en.has(k)).map((k) => `absente en anglais : ${k}`),
  ...[...en.keys()].filter((k) => !fr.has(k)).map((k) => `absente en français : ${k}`),
  ...[...fr, ...en].filter(([, v]) => v === '').map(([k]) => `valeur vide : ${k}`),
  ...[...fr].filter(([k, v]) => Array.isArray(v) && v.length !== en.get(k)?.length).map(([k]) => `listes de tailles différentes : ${k}`),
];
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Traductions complètes : ${fr.size} clés en français et en anglais.`);
