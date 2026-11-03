import { Router } from 'express';
import { INTERNAL_FIELDS } from '../lib/content.js';
import { ApiError, notFound } from '../lib/errors.js';
import { notifyNewMessage } from '../lib/notify.js';
import { sessionUser } from '../middleware/auth.js';
import { submissionLimiter } from '../middleware/security.js';
import { parse } from '../middleware/validate.js';
import { Article } from '../models/Article.js';
import { Campaign } from '../models/Campaign.js';
import { Partner } from '../models/Partner.js';
import { Project } from '../models/Project.js';
import { Publication } from '../models/Publication.js';
import { getSettings } from '../models/Settings.js';
import { Submission } from '../models/Submission.js';
import { TeamMember } from '../models/TeamMember.js';
import { articleQuery, campaignQuery, directoryQuery, projectQuery, publicationQuery, slugParam, submissionInput } from '../validators/index.js';

const MIN_FILL_MS = 2500;
const ID_PATTERN = /^[a-f0-9]{24}$/;

async function paginate(Model, filter, sort, { page, limit }) {
  const [items, total] = await Promise.all([
    Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).select(`-body -sections ${INTERNAL_FIELDS}`).lean(),
    Model.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/** L'aperçu d'un contenu non publié n'est accessible qu'avec une session d'administration valide. */
async function listFilter(req, res, filter) {
  const id = req.query.previewId;
  if (typeof id === 'string' && ID_PATTERN.test(id) && (await sessionUser(req))) {
    res.set('Cache-Control', 'no-store');
    return { _id: id };
  }
  return { published: true, ...filter };
}

function detailRoute(router, path, Model) {
  router.get(`${path}/:slug`, async (req, res) => {
    const { slug } = parse(slugParam, req.params);
    const preview = req.query.preview === '1' && (await sessionUser(req));
    if (preview) res.set('Cache-Control', 'no-store');
    const item = await Model.findOne(preview ? { slug } : { slug, published: true }).select(INTERNAL_FIELDS).lean();
    if (!item) throw notFound();
    // Une section masquée n'est jamais envoyée, même en aperçu : celui-ci montre ce que verra le public.
    if (item.sections) item.sections = item.sections.filter((s) => !s.hidden);
    res.json(item);
  });
}

export function publicRoutes() {
  const router = Router();

  router.get('/settings', async (_req, res) => {
    const settings = await getSettings();
    const { _id, key, __v, createdAt, updatedAt, notificationEmail, ...publicFields } = settings.toObject();
    res.json(publicFields);
  });

  // Maintenance : le public ne reçoit plus de contenus, les administrateurs connectés continuent d'y accéder.
  router.use(async (req, _res, next) => {
    const { maintenance } = await getSettings();
    if (maintenance?.enabled && !(await sessionUser(req))) throw new ApiError(503, 'maintenance');
    next();
  });

  router.get('/projects', async (req, res) => {
    const { category, status, ...page } = parse(projectQuery, req.query);
    res.json(await paginate(Project, compact({ published: true, category, status }), { isSample: 1, date: -1, createdAt: -1 }, page));
  });
  detailRoute(router, '/projects', Project);

  router.get('/articles', async (req, res) => {
    const { category, layout, ...page } = parse(articleQuery, req.query);
    res.json(await paginate(Article, compact({ published: true, category, layout }), { isSample: 1, publishedAt: -1, createdAt: -1 }, page));
  });
  detailRoute(router, '/articles', Article);

  router.get('/publications', async (req, res) => {
    const { type, ...page } = parse(publicationQuery, req.query);
    res.json(await paginate(Publication, await listFilter(req, res, compact({ type })), { isSample: 1, year: -1, createdAt: -1 }, page));
  });

  router.get('/campaigns', async (req, res) => {
    const { status, ...page } = parse(campaignQuery, req.query);
    res.json(await paginate(Campaign, compact({ published: true, campaignStatus: status }), { isSample: 1, startDate: -1, createdAt: -1 }, page));
  });
  detailRoute(router, '/campaigns', Campaign);

  router.get('/team', async (req, res) => {
    res.json(await paginate(TeamMember, await listFilter(req, res, {}), { order: 1, name: 1 }, parse(directoryQuery, req.query)));
  });

  router.get('/partners', async (req, res) => {
    res.json(await paginate(Partner, await listFilter(req, res, {}), { order: 1, name: 1 }, parse(directoryQuery, req.query)));
  });

  router.post('/submissions', submissionLimiter(), async (req, res) => {
    const { website, elapsedMs, consent, ...data } = parse(submissionInput, req.body);
    // Un robot probable reçoit la même réponse qu'un envoi réussi, sans que rien ne soit enregistré.
    if (website === '' && elapsedMs >= MIN_FILL_MS) {
      const submission = await Submission.create({ ...data, consentAt: new Date() });
      await notifyNewMessage(submission);
    }
    res.status(201).json({ ok: true });
  });

  return router;
}
