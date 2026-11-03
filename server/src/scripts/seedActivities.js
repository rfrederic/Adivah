// Crée les fiches des activités historiques (projets « terminés ») et place les photographies des pages.
// Ne remplace jamais un contenu existant ni une image déjà choisie dans le tableau de bord.
//   npm run seed:activities
import { connectDb, disconnectDb } from '../config/db.js';
import { historicalActivities, pagePhotos } from '../data/historicalActivities.js';
import { audit, SYSTEM_ACTOR } from '../lib/audit.js';
import { Project } from '../models/Project.js';
import { getSettings } from '../models/Settings.js';
import { projectInput } from '../validators/index.js';

async function main() {
  await connectDb();
  // Publiées : leur contenu est celui de la publication historique déjà validée et mise en ligne à la demande de l'ADIVAH.
  const actor = { name: `${SYSTEM_ACTOR.name} (à la demande du propriétaire)` };
  let created = 0;
  for (const { slug, input } of historicalActivities) {
    if (await Project.exists({ slug })) continue;
    const item = await Project.create({
      ...projectInput.parse(input),
      slug,
      published: true,
      workflowStatus: 'published',
      createdBy: actor,
      approvedBy: actor,
      publishedBy: actor,
      history: ['create', 'approve', 'publish'].map((action) => ({ action, by: actor })),
    });
    await audit({ ...SYSTEM_ACTOR, name: actor.name }, 'content.publish', { type: 'projects', id: item._id, label: item.title.fr });
    created += 1;
  }

  const settings = await getSettings();
  const filled = [];
  for (const field of ['heroImageUrl', 'aboutImageUrl']) {
    if (!settings[field]) {
      settings[field] = pagePhotos[field];
      filled.push(field);
    }
  }
  for (const key of ['hero', 'about']) {
    if (!settings.imageText?.[key]?.alt?.fr) settings.set(`imageText.${key}`, pagePhotos.imageText[key]);
  }
  if (!settings.storyImage?.url) {
    settings.storyImage = pagePhotos.storyImage;
    filled.push('storyImage');
  }
  for (const [area, image] of Object.entries(pagePhotos.areaImages)) {
    if (!settings.areaImages?.[area]?.url) {
      settings.set(`areaImages.${area}`, image);
      filled.push(`areaImages.${area}`);
    }
  }
  await settings.save();
  if (filled.length) await audit(SYSTEM_ACTOR, 'site_content.update', { type: 'settings', label: 'ADIVAH', details: filled.join(', ') });
  console.log(`${created} activité(s) créée(s). Images placées : ${filled.join(', ') || 'aucune (déjà choisies)'}.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
