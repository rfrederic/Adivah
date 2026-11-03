import mongoose from 'mongoose';
import { Router } from 'express';
import { AREAS } from '../../constants.js';
import { audit, changedFields } from '../../lib/audit.js';
import { ApiError, notFound } from '../../lib/errors.js';
import { removeUpload } from '../../lib/files.js';
import { requirePermission } from '../../middleware/auth.js';
import { receiveFile, storeFile } from '../../middleware/upload.js';
import { parse } from '../../middleware/validate.js';
import { Article } from '../../models/Article.js';
import { Campaign } from '../../models/Campaign.js';
import { Media } from '../../models/Media.js';
import { Partner } from '../../models/Partner.js';
import { Project } from '../../models/Project.js';
import { Publication } from '../../models/Publication.js';
import { Settings } from '../../models/Settings.js';
import { TeamMember } from '../../models/TeamMember.js';
import { idParam, mediaCategory, mediaQuery, mediaUpdate } from '../../validators/index.js';
import { escapeRegex } from './crud.js';

const REFERENCES = [
  [Project, 'image.url'], [Article, 'image.url'], [Campaign, 'image.url'], [TeamMember, 'image.url'], [Partner, 'image.url'],
  [Publication, 'fileUrl'],
  [Settings, 'logoUrl'], [Settings, 'heroImageUrl'], [Settings, 'aboutImageUrl'], [Settings, 'seo.ogImageUrl'], [Settings, 'storyImage.url'],
  ...AREAS.map((a) => [Settings, `areaImages.${a}.url`]),
];

const usageOf = async (url) => {
  const counts = await Promise.all([...REFERENCES, [Article, 'sections.photos.url'], [Article, 'logoUrl'], [Project, 'gallery.url']].map(([Model, field]) => Model.countDocuments({ [field]: url })));
  return counts.reduce((a, b) => a + b, 0);
};

const decodeName = (name = '') => Buffer.from(name, 'latin1').toString('utf8').slice(0, 200);

async function register(kind, req) {
  const stored = await storeFile(kind, req.file);
  const { category } = parse(mediaCategory, req.query);
  const media = await Media.create({
    ...stored,
    kind,
    category: category ?? (kind === 'image' ? 'photo' : 'report'),
    originalName: decodeName(req.file.originalname),
    uploadedBy: { id: req.user._id, name: req.user.name },
  });
  await audit(req.user, 'media.upload', { type: 'media', id: media._id, label: media.originalName });
  return media;
}

export function mediaRoutes() {
  const router = Router();

  router.get('/', async (req, res) => {
    const { q, kind, category, sort, dir, page, limit } = parse(mediaQuery, req.query);
    const filter = {};
    if (kind) filter.kind = kind;
    if (category) filter.category = category;
    if (q) {
      const rx = mongoose.trusted({ $regex: escapeRegex(q), $options: 'i' });
      filter.$or = [{ originalName: rx }, { 'alt.fr': rx }, { 'alt.en': rx }, { 'description.fr': rx }, { 'description.en': rx }];
    }
    const [items, total] = await Promise.all([
      Media.find(filter).sort({ [sort]: dir === 'asc' ? 1 : -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Media.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  });

  router.put('/:id', requirePermission('media.write'), async (req, res) => {
    const data = parse(mediaUpdate, req.body);
    const media = await Media.findById(parse(idParam, req.params).id);
    if (!media) throw notFound();
    const before = media.toObject();
    media.set(data);
    await media.save();
    await audit(req.user, 'media.update', { type: 'media', id: media._id, label: media.originalName, details: changedFields(before, data).join(', ') });
    res.json(media);
  });

  /** Remplace le fichier partout où il est utilisé. L'adresse change, car les fichiers sont mis en cache longtemps. */
  router.post(
    '/:id/replace',
    requirePermission('media.manage'),
    async (req, _res, next) => {
      req.media = await Media.findById(parse(idParam, req.params).id);
      if (!req.media) throw notFound();
      next();
    },
    (req, res, next) => receiveFile(req.media.kind)(req, res, next),
    async (req, res) => {
      const { media } = req;
      const stored = await storeFile(media.kind, req.file);
      const previous = media.url;
      await Promise.all(REFERENCES.map(([Model, field]) => Model.updateMany({ [field]: previous }, { $set: { [field]: stored.url } })));
      await Article.updateMany({ logoUrl: previous }, { $set: { logoUrl: stored.url } });
      await Article.updateMany(
        { 'sections.photos.url': previous },
        { $set: { 'sections.$[].photos.$[p].url': stored.url, 'sections.$[].photos.$[p].width': stored.width, 'sections.$[].photos.$[p].height': stored.height } },
        { arrayFilters: [{ 'p.url': previous }] },
      );
      await Project.updateMany(
        { 'gallery.url': previous },
        { $set: { 'gallery.$[p].url': stored.url, 'gallery.$[p].width': stored.width, 'gallery.$[p].height': stored.height } },
        { arrayFilters: [{ 'p.url': previous }] },
      );
      if (media.kind === 'document') await Publication.updateMany({ fileUrl: stored.url }, { $set: { fileSize: stored.size } });
      media.set({ ...stored, originalName: decodeName(req.file.originalname) });
      await media.save();
      await removeUpload(previous);
      await audit(req.user, 'media.replace', { type: 'media', id: media._id, label: media.originalName });
      res.json(media);
    },
  );

  router.delete('/:id', requirePermission('media.manage'), async (req, res) => {
    const media = await Media.findById(parse(idParam, req.params).id);
    if (!media) throw notFound();
    if (await usageOf(media.url)) throw new ApiError(409, 'in_use');
    await media.deleteOne();
    await removeUpload(media.url);
    await audit(req.user, 'media.delete', { type: 'media', id: media._id, label: media.originalName });
    res.status(204).end();
  });

  return router;
}

export function uploadRoutes() {
  const router = Router();
  router.use(requirePermission('media.write'));
  router.post('/image', receiveFile('image'), async (req, res) => res.status(201).json(await register('image', req)));
  router.post('/document', receiveFile('document'), async (req, res) => res.status(201).json(await register('document', req)));
  return router;
}
