import mongoose from 'mongoose';
import { Router } from 'express';
import { audit, changedFields } from '../../lib/audit.js';
import { labelOf } from '../../lib/content.js';
import { ApiError, notFound } from '../../lib/errors.js';
import { notifyWorkflow } from '../../lib/notify.js';
import { can } from '../../lib/permissions.js';
import { uniqueSlug } from '../../lib/slug.js';
import { actorRef, applyTransition, record, TRANSITIONS } from '../../lib/workflow.js';
import { requirePermission } from '../../middleware/auth.js';
import { parse } from '../../middleware/validate.js';
import { contentQuery, idParam, workflowInput } from '../../validators/index.js';

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Routes communes à tous les contenus. Chaque route vérifie le droit requis côté serveur. */
export function crudRoutes({ resource, Model, input, prepare = (d) => d, searchFields }) {
  const router = Router();
  const hasSlug = Boolean(Model.schema.path('slug'));

  router.get('/', async (req, res) => {
    const { q, status, sort, dir, page, limit } = parse(contentQuery, req.query);
    const filter = {};
    if (status) filter.workflowStatus = status;
    if (q) filter.$or = searchFields.map((f) => ({ [f]: mongoose.trusted({ $regex: escapeRegex(q), $options: 'i' }) }));
    const sortField = Model.schema.path(sort) || sort === 'title.fr' ? sort : 'updatedAt';
    const [items, total] = await Promise.all([
      Model.find(filter).sort({ [sortField]: dir === 'asc' ? 1 : -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select('-body -history').lean(),
      Model.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  });

  router.get('/:id', async (req, res) => {
    const item = await Model.findById(parse(idParam, req.params).id).lean();
    if (!item) throw notFound();
    res.json(item);
  });

  router.post('/', requirePermission('content.write'), async (req, res) => {
    const data = prepare(parse(input, req.body));
    const actor = actorRef(req.user);
    const slug = hasSlug ? { slug: await uniqueSlug(Model, data.title.fr) } : {};
    const item = new Model({ ...data, ...slug, published: false, workflowStatus: 'draft', createdBy: actor, updatedBy: actor });
    record(item, 'create', actor);
    await item.save();
    await audit(req.user, 'content.create', { type: resource, id: item._id, label: labelOf(item) });
    res.status(201).json(item);
  });

  router.put('/:id', requirePermission('content.write'), async (req, res) => {
    const item = await Model.findById(parse(idParam, req.params).id);
    if (!item) throw notFound();
    const isReviewer = can(req.user.role, 'content.review');
    // Un rédacteur ne modifie jamais ce qui est en ligne sans validation.
    if (!isReviewer && item.workflowStatus === 'published') throw new ApiError(403, 'content_locked');
    const data = prepare(parse(input, req.body), item);
    const before = item.toObject();
    item.set(data);
    const actor = actorRef(req.user);
    item.updatedBy = actor;
    if (!isReviewer && ['pending', 'approved'].includes(item.workflowStatus)) {
      item.workflowStatus = 'draft';
      item.publishAt = null;
      item.approvedBy = null;
    }
    record(item, 'edit', actor);
    await item.save();
    await audit(req.user, 'content.update', { type: resource, id: item._id, label: labelOf(item), details: changedFields(before, parse(input, req.body)).join(', ') });
    res.json(item);
  });

  router.delete('/:id', requirePermission('content.delete'), async (req, res) => {
    const item = await Model.findById(parse(idParam, req.params).id);
    if (!item) throw notFound();
    await item.deleteOne();
    await audit(req.user, 'content.delete', { type: resource, id: item._id, label: labelOf(item) });
    res.status(204).end();
  });

  for (const [action, { permission }] of Object.entries(TRANSITIONS)) {
    router.post(`/:id/${action}`, requirePermission(permission), async (req, res) => {
      const item = await Model.findById(parse(idParam, req.params).id);
      if (!item) throw notFound();
      const options = parse(workflowInput, req.body ?? {});
      applyTransition(item, action, req.user, options);
      await item.save();
      await audit(req.user, `content.${action}`, { type: resource, id: item._id, label: labelOf(item), details: options.comment });
      await notifyWorkflow(action, resource, item, options.comment);
      res.json(item);
    });
  }

  return router;
}
