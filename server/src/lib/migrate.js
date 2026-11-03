import { CONTENT_MODELS } from './content.js';
import { User } from '../models/User.js';

/** Mises à niveau sans danger, relancées à chaque démarrage : ne touche que ce qui n'a pas encore été converti. */
export async function migrate() {
  await User.collection.updateMany({ role: 'admin' }, { $set: { role: 'super_admin' } });
  await User.collection.updateMany({ status: { $exists: false } }, { $set: { status: 'active' } });
  for (const Model of Object.values(CONTENT_MODELS)) {
    await Model.collection.updateMany({ workflowStatus: { $exists: false }, published: true }, { $set: { workflowStatus: 'published' } });
    await Model.collection.updateMany({ workflowStatus: { $exists: false } }, { $set: { workflowStatus: 'draft' } });
  }
}
