import mongoose from 'mongoose';
import { audit, SYSTEM_ACTOR } from './audit.js';
import { CONTENT_MODELS, labelOf } from './content.js';
import { ApiError } from './errors.js';
import { notifyWorkflow } from './notify.js';

export const actorRef = (user) => ({ id: user._id, name: user.name });

/** Brouillon → À valider → Approuvé → Publié. Un refus renvoie le contenu à son auteur. */
export const TRANSITIONS = {
  submit: { from: ['draft', 'rejected'], permission: 'content.write' },
  approve: { from: ['draft', 'pending'], permission: 'content.review' },
  reject: { from: ['pending', 'approved'], permission: 'content.review' },
  publish: { from: ['approved'], permission: 'content.review' },
  schedule: { from: ['approved'], permission: 'content.review' },
  unpublish: { from: ['published'], permission: 'content.review' },
};

export const record = (item, action, actor, comment = '') => item.history.push({ action, by: actor, comment, at: new Date() });

function markPublished(item, actor) {
  item.published = true;
  item.workflowStatus = 'published';
  item.publishAt = null;
  item.publishedBy = actor;
  if (item.schema.path('publishedAt') && !item.isSample && !item.publishedAt) item.publishedAt = new Date();
}

export function applyTransition(item, action, user, { comment = '', publishAt = null }) {
  const rule = TRANSITIONS[action];
  if (!rule.from.includes(item.workflowStatus)) throw new ApiError(409, 'invalid_transition');
  const actor = actorRef(user);
  switch (action) {
    case 'submit':
      item.workflowStatus = 'pending';
      item.submittedBy = actor;
      break;
    case 'approve':
      item.workflowStatus = 'approved';
      item.approvedBy = actor;
      break;
    case 'reject':
      if (!comment) throw new ApiError(400, 'comment_required');
      item.workflowStatus = 'rejected';
      item.publishAt = null;
      item.approvedBy = null;
      break;
    case 'publish':
      markPublished(item, actor);
      break;
    case 'schedule':
      if (publishAt && publishAt <= new Date()) throw new ApiError(400, 'invalid_date');
      item.publishAt = publishAt;
      break;
    case 'unpublish':
      item.published = false;
      item.workflowStatus = 'draft';
      item.approvedBy = null;
      break;
    default:
      throw new ApiError(400, 'bad_request');
  }
  record(item, action, actor, comment);
}

/** Met en ligne les contenus approuvés dont l'heure de publication est passée. */
export async function publishDue(now = new Date()) {
  let count = 0;
  for (const [resource, Model] of Object.entries(CONTENT_MODELS)) {
    const due = await Model.find({ workflowStatus: 'approved', publishAt: mongoose.trusted({ $ne: null, $lte: now }) });
    for (const item of due) {
      const actor = { name: SYSTEM_ACTOR.name };
      markPublished(item, actor);
      record(item, 'publish', actor, '');
      await item.save();
      await audit(SYSTEM_ACTOR, 'content.publish', { type: resource, id: item._id, label: labelOf(item), details: 'scheduled' });
      await notifyWorkflow('publish', resource, item);
      count += 1;
    }
  }
  return count;
}

export function startScheduler() {
  const run = () => publishDue().catch((err) => console.error(`Publication programmée : ${err.message}`));
  run();
  return setInterval(run, 60 * 1000).unref();
}
