// Installe la publication historique en BROUILLON. Ne remplace jamais une version existante.
//   npm run seed:history
import { connectDb, disconnectDb } from '../config/db.js';
import { historyMedia, historyPublication, HISTORY_SLUG } from '../data/historyPublication.js';
import { audit, SYSTEM_ACTOR } from '../lib/audit.js';
import { Article } from '../models/Article.js';
import { Media } from '../models/Media.js';
import { articleInput } from '../validators/index.js';

async function main() {
  await connectDb();
  for (const { url, ...rest } of historyMedia) {
    await Media.updateOne(
      { url },
      { $setOnInsert: { url, kind: 'image', originalName: url.replace('/images/', ''), size: 0, ...rest } },
      { upsert: true },
    );
  }
  if (await Article.exists({ slug: HISTORY_SLUG })) {
    console.log('La publication existe déjà : rien n\'a été modifié.');
    return;
  }
  const actor = { name: SYSTEM_ACTOR.name };
  const item = await Article.create({
    ...articleInput.parse(historyPublication),
    slug: HISTORY_SLUG,
    published: false,
    workflowStatus: 'draft',
    createdBy: actor,
    updatedBy: actor,
    history: [{ action: 'create', by: actor }],
  });
  await audit(SYSTEM_ACTOR, 'content.create', { type: 'articles', id: item._id, label: item.title.fr });
  console.log(`Publication créée en brouillon : ${item.slug}`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
