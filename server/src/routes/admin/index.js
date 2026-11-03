import mongoose from 'mongoose';
import { createRequire } from 'node:module';
import { Router } from 'express';
import { audit, changedFields } from '../../lib/audit.js';
import { notFound } from '../../lib/errors.js';
import { mailStatus, sendMail } from '../../lib/mail.js';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { sameOriginOnly } from '../../middleware/security.js';
import { parse } from '../../middleware/validate.js';
import { Article } from '../../models/Article.js';
import { AuditLog } from '../../models/AuditLog.js';
import { Campaign } from '../../models/Campaign.js';
import { Partner } from '../../models/Partner.js';
import { Project } from '../../models/Project.js';
import { Publication } from '../../models/Publication.js';
import { getSettings } from '../../models/Settings.js';
import { Submission } from '../../models/Submission.js';
import { TeamMember } from '../../models/TeamMember.js';
import { articleInput, auditQuery, campaignInput, idParam, partnerInput, projectInput, publicationInput, settingsInput, siteContentInput, submissionQuery, submissionUpdate, teamMemberInput } from '../../validators/index.js';
import { crudRoutes, escapeRegex } from './crud.js';
import { mediaRoutes, uploadRoutes } from './media.js';
import { userRoutes } from './users.js';

const { orgName } = createRequire(import.meta.url)('../../../../shared/site.json');
const TITLE_SEARCH = ['title.fr', 'title.en'];
const CONTENT_MODELS = [Project, Article, Publication, Campaign, TeamMember, Partner];
const CONTENT_TYPES = ['projects', 'articles', 'publications', 'campaigns', 'team', 'partners', 'media'];

/** Conserve la date d'un article déjà paru si le champ est laissé vide. */
function prepareArticle(data, existing) {
  return !data.publishedAt && existing?.publishedAt ? { ...data, publishedAt: existing.publishedAt } : data;
}

export function adminRoutes() {
  const router = Router();
  router.use(sameOriginOnly, requireAuth);

  router.get('/stats', async (req, res) => {
    const canReadMessages = can(req.user.role, 'messages.manage');
    const canReadAudit = can(req.user.role, 'audit.read');
    const [projects, publishedArticles, draftArticles, publications, team, partners, campaigns, pendingCounts, samples, unread, recent] = await Promise.all([
      Project.countDocuments(),
      Article.countDocuments({ published: true }),
      Article.countDocuments({ published: false }),
      Publication.countDocuments(),
      TeamMember.countDocuments(),
      Partner.countDocuments(),
      Campaign.countDocuments(),
      Promise.all(CONTENT_MODELS.map((M) => M.countDocuments({ workflowStatus: 'pending' }))),
      Promise.all([Project, Article, Publication].map((M) => M.countDocuments({ isSample: true }))),
      canReadMessages ? Submission.countDocuments({ status: 'new' }) : null,
      // Les rôles sans accès au journal ne voient que l'activité sur les contenus.
      AuditLog.find(canReadAudit ? {} : { targetType: mongoose.trusted({ $in: CONTENT_TYPES }) }).sort({ createdAt: -1 }).limit(8).select('actorName action targetType targetLabel createdAt').lean(),
    ]);
    res.json({
      projects,
      publishedArticles,
      draftArticles,
      publications,
      team,
      partners,
      campaigns,
      pending: pendingCounts.reduce((a, b) => a + b, 0),
      samples: samples.reduce((a, b) => a + b, 0),
      ...(canReadMessages ? { newSubmissions: unread } : {}),
      recent,
    });
  });

  router.use('/projects', crudRoutes({ resource: 'projects', Model: Project, input: projectInput, searchFields: TITLE_SEARCH }));
  router.use('/articles', crudRoutes({ resource: 'articles', Model: Article, input: articleInput, prepare: prepareArticle, searchFields: TITLE_SEARCH }));
  router.use('/publications', crudRoutes({ resource: 'publications', Model: Publication, input: publicationInput, searchFields: TITLE_SEARCH }));
  router.use('/campaigns', crudRoutes({ resource: 'campaigns', Model: Campaign, input: campaignInput, searchFields: TITLE_SEARCH }));
  router.use('/team', crudRoutes({ resource: 'team', Model: TeamMember, input: teamMemberInput, searchFields: ['name', 'position.fr', 'position.en'] }));
  router.use('/partners', crudRoutes({ resource: 'partners', Model: Partner, input: partnerInput, searchFields: ['name'] }));

  router.use('/uploads', uploadRoutes());
  router.use('/media', mediaRoutes());
  router.use('/users', userRoutes());

  // Lecture seule : aucune route ne permet de modifier ou de supprimer une entrée du journal.
  router.get('/audit', requirePermission('audit.read'), async (req, res) => {
    const { q, action, page, limit } = parse(auditQuery, req.query);
    const filter = {};
    if (action) filter.action = action;
    if (q) {
      const rx = mongoose.trusted({ $regex: escapeRegex(q), $options: 'i' });
      filter.$or = [{ actorName: rx }, { actorEmail: rx }, { targetLabel: rx }];
    }
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  });

  router.get('/permissions', (_req, res) => res.json(PERMISSIONS));

  // Données personnelles : réservées aux rôles autorisés.
  const messages = requirePermission('messages.manage');

  router.get('/submissions', messages, async (req, res) => {
    const { status, type, page, limit } = parse(submissionQuery, req.query);
    const filter = Object.fromEntries(Object.entries({ status, type }).filter(([, v]) => v));
    const [items, total] = await Promise.all([
      Submission.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Submission.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  });

  router.patch('/submissions/:id', messages, async (req, res) => {
    const { status } = parse(submissionUpdate, req.body);
    const item = await Submission.findByIdAndUpdate(parse(idParam, req.params).id, { status }, { returnDocument: 'after' });
    if (!item) throw notFound();
    await audit(req.user, 'message.status', { type: 'message', id: item._id, details: status });
    res.json(item);
  });

  router.delete('/submissions/:id', messages, async (req, res) => {
    const item = await Submission.findByIdAndDelete(parse(idParam, req.params).id);
    if (!item) throw notFound();
    await audit(req.user, 'message.delete', { type: 'message', id: item._id });
    res.status(204).end();
  });

  router.get('/settings', async (req, res) => {
    const settings = (await getSettings()).toObject();
    if (!can(req.user.role, 'settings.write')) delete settings.notificationEmail;
    res.json({ ...settings, orgName, mail: mailStatus() });
  });

  const save = (action, input) => async (req, res) => {
    const data = parse(input, req.body);
    const settings = await getSettings();
    const before = settings.toObject();
    settings.set(data);
    settings.markModified('textOverrides');
    await settings.save();
    await audit(req.user, action, { type: 'settings', label: 'ADIVAH', details: changedFields(before, data).join(', ') });
    res.json(settings);
  };
  router.put('/settings', requirePermission('settings.write'), save('settings.update', settingsInput));
  router.put('/site-content', requirePermission('pages.write'), save('site_content.update', siteContentInput));

  router.post('/settings/test-email', requirePermission('settings.write'), async (req, res) => {
    const sent = await sendMail({ to: req.user.email, subject: 'ADIVAH : e-mail de test / test email', text: "La configuration d'envoi fonctionne.\n\nEmail sending works." });
    res.json({ sent });
  });

  return router;
}
