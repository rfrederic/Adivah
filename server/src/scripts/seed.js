// Installe les paramètres initiaux et les EXEMPLES clairement identifiés.
// Relançable sans risque : seuls les contenus marqués « exemple » sont remplacés ; les contenus réels ne sont jamais touchés.
import { connectDb, disconnectDb } from '../config/db.js';
import { AREAS, ARTICLE_CATEGORIES, PUBLICATION_TYPES } from '../constants.js';
import { Article } from '../models/Article.js';
import { Project } from '../models/Project.js';
import { Publication } from '../models/Publication.js';
import { getSettings } from '../models/Settings.js';

const AREA_LABELS = {
  'human-rights': ['Défense des droits humains', 'Human rights advocacy'],
  'social-justice': ['Justice sociale et égalité', 'Social justice and equality'],
  community: ['Développement communautaire', 'Community development'],
  education: ['Éducation et sensibilisation', 'Education and awareness'],
  protection: ['Protection des personnes vulnérables', 'Protection of vulnerable people'],
  citizenship: ['Citoyenneté et participation démocratique', 'Citizenship and democratic participation'],
};
const ARTICLE_LABELS = {
  announcement: ['annonce', 'announcement'],
  'human-rights': ['droits humains', 'human rights update'],
  community: ['activité communautaire', 'community activity'],
  press: ['communiqué de presse', 'press release'],
  report: ['rapport', 'report'],
  education: ['article éducatif', 'educational article'],
};
const PUBLICATION_LABELS = {
  report: ['rapport sur les droits humains', 'human rights report'],
  research: ['document de recherche', 'research document'],
  education: ['support éducatif', 'educational material'],
  organizational: ['publication institutionnelle', 'organizational publication'],
  resource: ['ressource PDF', 'PDF resource'],
};

const fr = 'Contenu d\'exemple à remplacer depuis le tableau de bord. Il ne décrit aucune activité réelle de l\'ADIVAH.';
const en = 'Sample content to be replaced from the dashboard. It does not describe any actual ADIVAH activity.';

const projects = AREAS.map((area) => ({
  slug: `exemple-projet-${area}`,
  title: { fr: `Exemple de projet – ${AREA_LABELS[area][0]}`, en: `Sample project – ${AREA_LABELS[area][1]}` },
  summary: { fr, en },
  body: { fr: `${fr}\n\nVous pourrez y présenter le contexte, les objectifs, les personnes concernées et les résultats du projet.`, en: `${en}\n\nThis is where you can present the project's context, objectives, the people involved and its results.` },
  location: { fr: 'Lieu à confirmer', en: 'Location to be confirmed' },
  date: null,
  status: 'to-confirm',
  category: area,
  published: true,
  workflowStatus: 'published',
  isSample: true,
}));

const articles = ARTICLE_CATEGORIES.map((category) => ({
  slug: `exemple-actualite-${category}`,
  title: { fr: `Exemple d'actualité – ${ARTICLE_LABELS[category][0]}`, en: `Sample news item – ${ARTICLE_LABELS[category][1]}` },
  excerpt: { fr, en },
  body: { fr: `${fr}\n\nLes administrateurs pourront publier ici le texte complet en français et en anglais.`, en: `${en}\n\nAdministrators will be able to publish the full text here in French and English.` },
  category,
  publishedAt: null,
  published: true,
  workflowStatus: 'published',
  isSample: true,
}));

const publications = PUBLICATION_TYPES.map((type) => ({
  slug: `exemple-publication-${type}`,
  title: { fr: `Exemple – ${PUBLICATION_LABELS[type][0]}`, en: `Sample – ${PUBLICATION_LABELS[type][1]}` },
  description: { fr, en },
  type,
  fileUrl: '',
  language: 'both',
  published: true,
  workflowStatus: 'published',
  isSample: true,
}));

async function replaceSamples(Model, items) {
  await Model.deleteMany({ isSample: true });
  await Model.insertMany(items);
}

async function main() {
  await connectDb();
  await getSettings();
  await replaceSamples(Project, projects);
  await replaceSamples(Article, articles);
  await replaceSamples(Publication, publications);
  console.log(`Exemples installés : ${projects.length} projets, ${articles.length} actualités, ${publications.length} publications.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
