process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/adivah_test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-test';
process.env.SITE_URL = 'http://localhost:5173';

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'adivah-cms-test-'));
process.env.UPLOAD_DIR = uploadDir;

const { default: bcrypt } = await import('bcryptjs');
const { default: mongoose } = await import('mongoose');
const { default: sharp } = await import('sharp');
const { default: request } = await import('supertest');
const { createApp } = await import('../src/app.js');
const { connectDb } = await import('../src/config/db.js');
const { testOutbox } = await import('../src/lib/mail.js');
const { migrate } = await import('../src/lib/migrate.js');
const { publishDue } = await import('../src/lib/workflow.js');
const { AuditLog } = await import('../src/models/AuditLog.js');
const { Project } = await import('../src/models/Project.js');
const { historyPublication } = await import('../src/data/historyPublication.js');
const { historicalActivities, pagePhotos } = await import('../src/data/historicalActivities.js');
const { User } = await import('../src/models/User.js');

const PASSWORD = 'Mot-de-passe-de-test-1';
const ORIGIN = 'http://localhost:5173';
const ROLES = { super: 'super_admin', content: 'content_admin', editor: 'editor', viewer: 'viewer' };

let app;
let hash;

const as = async (who) => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').set('Origin', ORIGIN).send({ email: `${who}@test.org`, password: PASSWORD }).expect(200);
  return agent;
};
const body = (over = {}) => ({ title: { fr: 'Projet test', en: 'Test project' }, status: 'planned', category: 'education', ...over });
const create = async (agent, over) => (await agent.post('/api/admin/projects').send(body(over)).expect(201)).body;
const step = (agent, id, action, data = {}, code = 200) => agent.post(`/api/admin/projects/${id}/${action}`).send(data).expect(code);

before(async () => {
  await connectDb(process.env.MONGODB_URI);
  hash = await bcrypt.hash(PASSWORD, 4);
  app = createApp();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).init()));
  await User.create(Object.entries(ROLES).map(([who, role]) => ({ name: who, email: `${who}@test.org`, passwordHash: hash, role })));
  testOutbox.length = 0;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await fs.rm(uploadDir, { recursive: true, force: true });
});

describe('rôles appliqués par le serveur', () => {
  it('le lecteur ne peut rien créer, modifier, publier ni supprimer', async () => {
    const admin = await as('super');
    const item = await create(admin);
    const viewer = await as('viewer');
    await viewer.get('/api/admin/projects').expect(200);
    await viewer.post('/api/admin/projects').send(body()).expect(403);
    await viewer.put(`/api/admin/projects/${item._id}`).send(body()).expect(403);
    await viewer.delete(`/api/admin/projects/${item._id}`).expect(403);
    await step(viewer, item._id, 'submit', {}, 403);
    await step(viewer, item._id, 'approve', {}, 403);
    await viewer.post('/api/admin/uploads/image').expect(403);
    await viewer.put('/api/admin/site-content').send({}).expect(403);
  });

  it("l'éditeur crée et soumet, sans approuver, publier, supprimer ni gérer les comptes", async () => {
    const editor = await as('editor');
    const item = await create(editor);
    await step(editor, item._id, 'approve', {}, 403);
    await step(editor, item._id, 'publish', {}, 403);
    await editor.delete(`/api/admin/projects/${item._id}`).expect(403);
    await step(editor, item._id, 'submit');
    for (const url of ['/api/admin/users', '/api/admin/audit', '/api/admin/submissions']) await editor.get(url).expect(403);
    await editor.put('/api/admin/settings').send({}).expect(403);
  });

  it("l'administrateur de contenu publie mais n'accède ni aux comptes, ni au journal, ni aux messages, ni aux paramètres", async () => {
    const content = await as('content');
    const item = await create(content);
    await step(content, item._id, 'approve');
    await step(content, item._id, 'publish');
    for (const url of ['/api/admin/users', '/api/admin/audit', '/api/admin/submissions']) await content.get(url).expect(403);
    await content.put('/api/admin/settings').send({}).expect(403);
    const stats = (await content.get('/api/admin/stats').expect(200)).body;
    assert.equal(stats.newSubmissions, undefined);
  });

  it('un rôle hérité « admin » devient super administrateur', async () => {
    await User.collection.insertOne({ name: 'Ancien', email: 'ancien@test.org', passwordHash: hash, role: 'admin', tokenVersion: 0 });
    await migrate();
    const user = await User.findOne({ email: 'ancien@test.org' });
    assert.equal(user.role, 'super_admin');
    assert.equal(user.status, 'active');
  });
});

describe('circuit de validation', () => {
  it('suit Brouillon → À valider → Approuvé → Publié, et trace les auteurs', async () => {
    const editor = await as('editor');
    const reviewer = await as('content');
    const item = await create(editor);
    assert.equal(item.workflowStatus, 'draft');
    await request(app).get(`/api/projects/${item.slug}`).expect(404);
    await step(editor, item._id, 'submit');
    await request(app).get(`/api/projects/${item.slug}`).expect(404);
    const approved = (await step(reviewer, item._id, 'approve')).body;
    assert.equal(approved.approvedBy.name, 'content');
    await request(app).get(`/api/projects/${item.slug}`).expect(404);
    const live = (await step(reviewer, item._id, 'publish')).body;
    assert.equal(live.workflowStatus, 'published');
    assert.equal(live.createdBy.name, 'editor');
    assert.equal(live.submittedBy.name, 'editor');
    assert.equal(live.publishedBy.name, 'content');
    assert.deepEqual(live.history.map((h) => h.action), ['create', 'submit', 'approve', 'publish']);
    await request(app).get(`/api/projects/${item.slug}`).expect(200);
  });

  it('refuse les sauts d\'étape et exige un commentaire pour un refus', async () => {
    const editor = await as('editor');
    const reviewer = await as('content');
    const item = await create(editor);
    await step(reviewer, item._id, 'publish', {}, 409);
    await step(editor, item._id, 'submit');
    await step(reviewer, item._id, 'reject', {}, 400);
    const rejected = (await step(reviewer, item._id, 'reject', { comment: 'Sources à préciser' })).body;
    assert.equal(rejected.workflowStatus, 'rejected');
    assert.equal(rejected.history.at(-1).comment, 'Sources à préciser');
    await step(editor, item._id, 'submit');
  });

  it("l'éditeur ne peut pas modifier un contenu en ligne ; modifier un contenu approuvé le renvoie en brouillon", async () => {
    const editor = await as('editor');
    const reviewer = await as('content');
    const item = await create(editor);
    await step(reviewer, item._id, 'approve');
    const back = (await editor.put(`/api/admin/projects/${item._id}`).send(body({ summary: { fr: 'Changé', en: '' } })).expect(200)).body;
    assert.equal(back.workflowStatus, 'draft');
    await step(reviewer, item._id, 'approve');
    await step(reviewer, item._id, 'publish');
    const res = await editor.put(`/api/admin/projects/${item._id}`).send(body()).expect(403);
    assert.equal(res.body.error.code, 'content_locked');
    await reviewer.put(`/api/admin/projects/${item._id}`).send(body({ summary: { fr: 'Corrigé', en: '' } })).expect(200);
  });

  it('publie à l\'heure programmée, pas avant, et refuse une date passée', async () => {
    const reviewer = await as('content');
    const item = await create(reviewer);
    await step(reviewer, item._id, 'approve');
    await step(reviewer, item._id, 'schedule', { publishAt: new Date(Date.now() - 60000).toISOString() }, 400);
    const at = new Date(Date.now() + 3600000);
    await step(reviewer, item._id, 'schedule', { publishAt: at.toISOString() });
    assert.equal(await publishDue(new Date()), 0);
    await request(app).get(`/api/projects/${item.slug}`).expect(404);
    assert.equal(await publishDue(new Date(at.getTime() + 1000)), 1);
    const live = (await request(app).get(`/api/projects/${item.slug}`).expect(200)).body;
    assert.ok(live.title.fr);
    const log = await AuditLog.findOne({ action: 'content.publish' }).lean();
    assert.equal(log.actorRole, 'system');
  });

  it("n'expose jamais au public le circuit interne ni l'identité du personnel", async () => {
    const reviewer = await as('content');
    const item = await create(reviewer);
    await step(reviewer, item._id, 'approve');
    await step(reviewer, item._id, 'publish');
    for (const url of ['/api/projects', `/api/projects/${item.slug}`]) {
      const text = JSON.stringify((await request(app).get(url).expect(200)).body);
      for (const field of ['history', 'createdBy', 'approvedBy', 'publishedBy', 'workflowStatus']) assert.equal(text.includes(field), false, field);
    }
  });

  it("l'aperçu d'un contenu non publié exige une session", async () => {
    const editor = await as('editor');
    const item = await create(editor);
    await request(app).get(`/api/projects/${item.slug}?preview=1`).expect(404);
    await editor.get(`/api/projects/${item.slug}?preview=1`).expect(200);
    const team = (await editor.post('/api/admin/team').send({ name: 'Personne test' }).expect(201)).body;
    assert.equal((await request(app).get(`/api/team?previewId=${team._id}`).expect(200)).body.total, 0);
    assert.equal((await editor.get(`/api/team?previewId=${team._id}`).expect(200)).body.total, 1);
  });
});

describe('équipe, partenaires, campagnes et recherche', () => {
  it('publie chaque type et le rend public', async () => {
    const admin = await as('content');
    const samples = {
      team: [{ name: 'Personne test', position: { fr: 'Poste', en: 'Role' } }, '/api/team'],
      partners: [{ name: 'Partenaire test', website: 'https://example.org' }, '/api/partners'],
      campaigns: [{ title: { fr: 'Campagne', en: 'Campaign' }, campaignStatus: 'active' }, '/api/campaigns'],
    };
    for (const [resource, [data, url]] of Object.entries(samples)) {
      const item = (await admin.post(`/api/admin/${resource}`).send(data).expect(201)).body;
      assert.equal((await request(app).get(url).expect(200)).body.total, 0);
      await admin.post(`/api/admin/${resource}/${item._id}/approve`).send({}).expect(200);
      await admin.post(`/api/admin/${resource}/${item._id}/publish`).send({}).expect(200);
      assert.equal((await request(app).get(url).expect(200)).body.total, 1);
    }
    await admin.post('/api/admin/partners').send({ name: 'x', website: 'javascript:alert(1)' }).expect(400);
  });

  it('recherche, filtre, trie et pagine les listes, sans injection', async () => {
    const admin = await as('content');
    for (const name of ['Alpha', 'Bravo', 'Charlie']) await create(admin, { title: { fr: name, en: '' } });
    const first = await create(admin, { title: { fr: 'Delta', en: '' } });
    await step(admin, first._id, 'submit');
    assert.equal((await admin.get('/api/admin/projects?q=brav').expect(200)).body.total, 1);
    assert.equal((await admin.get('/api/admin/projects?q=.*').expect(200)).body.total, 0);
    assert.equal((await admin.get('/api/admin/projects?status=pending').expect(200)).body.total, 1);
    const sorted = (await admin.get('/api/admin/projects?sort=title.fr&dir=asc&limit=2').expect(200)).body;
    assert.deepEqual(sorted.items.map((i) => i.title.fr), ['Alpha', 'Bravo']);
    assert.equal(sorted.pages, 2);
    await admin.get('/api/admin/projects?sort=passwordHash').expect(400);
  });
});

describe('comptes et sécurité', () => {
  it('verrouille un compte après 5 échecs, même avec le bon mot de passe ensuite', async () => {
    const fresh = createApp();
    const login = (password) => request(fresh).post('/api/auth/login').send({ email: 'editor@test.org', password });
    for (let i = 0; i < 5; i += 1) await login('mauvais').expect(401);
    const res = await login(PASSWORD).expect(401);
    assert.equal(res.body.error.code, 'invalid_credentials');
    assert.ok(await AuditLog.exists({ action: 'account_locked' }));
    assert.ok(testOutbox.some((m) => m.subject.includes('verrouillé')));
    await User.updateOne({ email: 'editor@test.org' }, { lockedUntil: new Date(Date.now() - 1000) });
    await login(PASSWORD).expect(200);
  });

  it('récupère un mot de passe : lien unique, jeton non stocké en clair, anciennes sessions fermées', async () => {
    const fresh = createApp();
    const stale = await as('editor');
    await request(fresh).post('/api/auth/forgot-password').send({ email: 'inconnu@test.org' }).expect(200);
    assert.equal(testOutbox.length, 0);
    await request(fresh).post('/api/auth/forgot-password').send({ email: 'editor@test.org' }).expect(200);
    const token = testOutbox[0].text.match(/token=([a-f0-9]{64})/)[1];
    const stored = await User.findOne({ email: 'editor@test.org' }).select('+resetTokenHash').lean();
    assert.notEqual(stored.resetTokenHash, token);
    await request(fresh).post('/api/auth/reset-password').send({ token, newPassword: 'faible' }).expect(400);
    await request(fresh).post('/api/auth/reset-password').send({ token, newPassword: 'Nouveau-secret-1234' }).expect(200);
    await request(fresh).post('/api/auth/reset-password').send({ token, newPassword: 'Autre-secret-12345' }).expect(400);
    await stale.get('/api/auth/me').expect(401);
    await request(fresh).post('/api/auth/login').send({ email: 'editor@test.org', password: 'Nouveau-secret-1234' }).expect(200);
  });

  it('refuse un lien expiré et les mots de passe faibles', async () => {
    const fresh = createApp();
    await request(fresh).post('/api/auth/forgot-password').send({ email: 'editor@test.org' }).expect(200);
    const token = testOutbox[0].text.match(/token=([a-f0-9]{64})/)[1];
    await User.updateOne({ email: 'editor@test.org' }, { resetTokenExpires: new Date(Date.now() - 1000) });
    await request(fresh).post('/api/auth/reset-password').send({ token, newPassword: 'Nouveau-secret-1234' }).expect(400);
    const agent = await as('editor');
    for (const weak of ['courte1A', 'toutenminuscules123', 'SansChiffreDuTout', 'Editor-test-12345']) {
      const res = await agent.post('/api/auth/change-password').send({ currentPassword: PASSWORD, newPassword: weak }).expect(400);
      assert.equal(res.body.error.code, 'weak_password');
    }
  });

  it('crée un compte par invitation, sans mot de passe exposé', async () => {
    const admin = await as('super');
    const res = await admin.post('/api/admin/users').send({ name: 'Nouvelle', email: 'nouvelle@test.org', role: 'viewer' }).expect(201);
    assert.equal(JSON.stringify(res.body).includes('password'), false);
    assert.equal(JSON.stringify(res.body).includes('token'), false);
    const token = testOutbox[0].text.match(/token=([a-f0-9]{64})/)[1];
    await request(createApp()).post('/api/auth/reset-password').send({ token, newPassword: 'Choisi-par-elle-123' }).expect(200);
    await admin.post('/api/admin/users').send({ name: 'x', email: 'nouvelle@test.org', role: 'viewer' }).expect(409);
  });

  it('suspendre ou changer un rôle ferme la session ; protège soi-même et le dernier super administrateur', async () => {
    const admin = await as('super');
    const editor = await as('editor');
    const { _id: editorId } = await User.findOne({ email: 'editor@test.org' }).lean();
    const { _id: adminId } = await User.findOne({ email: 'super@test.org' }).lean();
    await admin.patch(`/api/admin/users/${editorId}`).send({ status: 'suspended' }).expect(200);
    await editor.get('/api/auth/me').expect(401);
    await request(app).post('/api/auth/login').send({ email: 'editor@test.org', password: PASSWORD }).expect(401);
    await admin.patch(`/api/admin/users/${adminId}`).send({ role: 'viewer' }).expect(409);
    await admin.delete(`/api/admin/users/${adminId}`).expect(409);
    assert.ok(await AuditLog.exists({ action: 'user.suspend' }));
    await admin.patch(`/api/admin/users/${editorId}`).send({ role: 'viewer', status: 'active' }).expect(200);
    assert.ok(await AuditLog.exists({ action: 'user.role_change' }));
  });
});

describe('journal d\'audit', () => {
  it('enregistre les actions, reste réservé et ne peut pas être modifié', async () => {
    const admin = await as('super');
    const item = await create(admin);
    await admin.put(`/api/admin/projects/${item._id}`).send(body({ title: { fr: 'Nouveau titre', en: '' } })).expect(200);
    await step(admin, item._id, 'approve');
    await admin.delete(`/api/admin/projects/${item._id}`).expect(204);
    await admin.post('/api/auth/logout').set('Origin', ORIGIN).expect(200);
    const again = await as('super');
    const { items } = (await again.get('/api/admin/audit?limit=50').expect(200)).body;
    const actions = items.map((i) => i.action);
    for (const a of ['login', 'logout', 'content.create', 'content.update', 'content.approve', 'content.delete']) assert.ok(actions.includes(a), a);
    const update = items.find((i) => i.action === 'content.update');
    assert.equal(update.actorName, 'super');
    assert.match(update.details, /title/);
    assert.ok(update.createdAt);
    await again.delete(`/api/admin/audit/${items[0]._id}`).expect(404);
    await again.put(`/api/admin/audit/${items[0]._id}`).send({}).expect(404);
    await assert.rejects(AuditLog.deleteMany({}));
    await assert.rejects(AuditLog.updateOne({}, { action: 'x' }));
    const entry = await AuditLog.findOne();
    entry.action = 'x';
    await assert.rejects(entry.save());
  });
});

describe('notifications', () => {
  it('prévient sans jamais copier le contenu du message', async () => {
    await request(app).post('/api/submissions').send({ name: 'Marie', email: 'marie@example.org', message: 'Information confidentielle à protéger', consent: true, website: '', elapsedMs: 8000 }).expect(201);
    assert.equal(testOutbox.length, 1);
    assert.deepEqual(testOutbox[0].to, ['super@test.org']);
    assert.equal(testOutbox[0].text.includes('confidentielle'), false);
    assert.equal(testOutbox[0].text.includes('Marie'), false);
  });

  it('prévient à chaque étape : soumission, refus, approbation, publication', async () => {
    const editor = await as('editor');
    const reviewer = await as('content');
    const item = await create(editor);
    await step(editor, item._id, 'submit');
    assert.deepEqual(testOutbox.at(-1).to.sort(), ['content@test.org', 'super@test.org']);
    await step(reviewer, item._id, 'reject', { comment: 'À revoir' });
    assert.deepEqual(testOutbox.at(-1).to, ['editor@test.org']);
    assert.match(testOutbox.at(-1).text, /À revoir/);
    await step(editor, item._id, 'submit');
    await step(reviewer, item._id, 'approve');
    assert.match(testOutbox.at(-1).subject, /approuvé/);
    await step(reviewer, item._id, 'publish');
    assert.match(testOutbox.at(-1).subject, /publié/);
  });
});

describe('médiathèque', () => {
  it('retire les données GPS, enregistre la catégorie et les descriptions bilingues', async () => {
    const admin = await as('content');
    const photo = await sharp({ create: { width: 40, height: 30, channels: 3, background: 'blue' } })
      .withExif({ IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '18/1 32/1 0/1' } })
      .jpeg()
      .toBuffer();
    assert.ok((await sharp(photo).metadata()).exif);
    const media = (await admin.post('/api/admin/uploads/image?category=team').attach('file', photo, 'portrait é.jpg').expect(201)).body;
    assert.equal(media.category, 'team');
    assert.equal(media.originalName, 'portrait é.jpg');
    const stored = await fs.readFile(path.join(uploadDir, media.url.replace('/uploads/', '')));
    assert.equal((await sharp(stored).metadata()).exif, undefined);
    const updated = (await admin.put(`/api/admin/media/${media._id}`).send({ category: 'photo', alt: { fr: 'Texte', en: 'Text' }, description: { fr: 'Desc', en: 'Desc' } }).expect(200)).body;
    assert.equal(updated.alt.en, 'Text');
    assert.equal((await admin.get('/api/admin/media?category=photo&q=Text').expect(200)).body.total, 1);
    await admin.post('/api/admin/uploads/image?category=inconnue').attach('file', photo, 'x.jpg').expect(400);
  });

  it('remplacer un fichier met à jour tous les contenus qui l\'utilisent', async () => {
    const admin = await as('content');
    const make = (background) => sharp({ create: { width: 10, height: 10, channels: 3, background } }).png().toBuffer();
    const media = (await admin.post('/api/admin/uploads/image').attach('file', await make('red'), 'a.png').expect(201)).body;
    const item = await create(admin, { image: { url: media.url, alt: { fr: '', en: '' } } });
    const editor = await as('editor');
    await editor.post(`/api/admin/media/${media._id}/replace`).attach('file', await make('blue'), 'b.png').expect(403);
    const next = (await admin.post(`/api/admin/media/${media._id}/replace`).attach('file', await make('blue'), 'b.png').expect(200)).body;
    assert.notEqual(next.url, media.url);
    assert.equal((await Project.findById(item._id).lean()).image.url, next.url);
    await request(app).get(media.url).expect(404);
    await request(app).get(next.url).expect(200);
  });
});

describe('publication historique', () => {
  it('valide le contenu fourni : toujours un brouillon, section masquée et notes jamais publiques', async () => {
    const admin = await as('content');
    const item = (await admin.post('/api/admin/articles').send(historyPublication).expect(201)).body;
    assert.equal(item.workflowStatus, 'draft');
    assert.equal(item.published, false);
    await request(app).get(`/api/articles/${item.slug}`).expect(404);
    await admin.post(`/api/admin/articles/${item._id}/approve`).send({}).expect(200);
    await admin.post(`/api/admin/articles/${item._id}/publish`).send({}).expect(200);
    const pub = (await request(app).get(`/api/articles/${item.slug}`).expect(200)).body;
    assert.equal(pub.sections.length, 7);
    const text = JSON.stringify(pub);
    assert.equal(text.includes('Auxcayes2017'), false);
    assert.equal(text.includes('reviewNotes'), false);
    assert.equal(text.includes('VÉRIFIER'), false);
    assert.ok(text.includes("Sur la route d'Hinche1.jpg"));
    const list = JSON.stringify((await request(app).get('/api/articles').expect(200)).body);
    assert.equal(list.includes('sections'), false);
    const html = await request(app).get(`/en/news/${item.slug}`);
    if (html.status === 200 && html.text.includes('<title>')) {
      assert.match(html.text, /ADIVAH Haiti: Years of Commitment/);
      assert.match(html.text, /og:image" content="http:\/\/localhost:5173\/images\/28mars20016_2\.jpg/);
      assert.match(html.text, /hreflang="fr"/);
    }
  });

  it('refuse un chemin d\'image dangereux ou externe', async () => {
    const admin = await as('content');
    for (const url of ['/images/../../.env', '/images/a/b.jpg', '/images/x.svg', 'https://evil.example/a.jpg', '/images/a"><script>.jpg']) {
      const section = { key: 'a', photos: [{ url }] };
      await admin.post('/api/admin/articles').send({ title: { fr: 'T', en: '' }, category: 'community', sections: [section] }).expect(400);
    }
  });

  it('remplacer un fichier met à jour les galeries ; un fichier utilisé ne peut pas être supprimé', async () => {
    const admin = await as('content');
    const png = (c) => sharp({ create: { width: 10, height: 6, channels: 3, background: c } }).png().toBuffer();
    const media = (await admin.post('/api/admin/uploads/image').attach('file', await png('red'), 'a.png').expect(201)).body;
    const item = (await admin.post('/api/admin/articles').send({ title: { fr: 'T', en: '' }, category: 'community', layout: 'history', sections: [{ key: 'a', photos: [{ url: media.url }] }] }).expect(201)).body;
    await admin.delete(`/api/admin/media/${media._id}`).expect(409);
    const next = (await admin.post(`/api/admin/media/${media._id}/replace`).attach('file', await png('blue'), 'b.png').expect(200)).body;
    const read = (await admin.get(`/api/admin/articles/${item._id}`).expect(200)).body;
    assert.equal(read.sections[0].photos[0].url, next.url);
    assert.equal(read.sections[0].photos[0].width, 10);
  });
});

describe('photographies du site', () => {
  it('sert des versions allégées sans métadonnées, et refuse tout autre chemin', async () => {
    const res = await request(app).get(`/img?w=480&src=${encodeURIComponent("/images/Sur la route d'Hinche1.jpg")}`).expect(200);
    assert.equal(res.headers['content-type'], 'image/webp');
    const meta = await sharp(res.body).metadata();
    assert.equal(meta.width, 480);
    assert.equal(meta.exif, undefined);
    await request(app).get('/img?w=481&src=/images/logo.JPG').expect(400);
    for (const src of ['/images/../../server/.env', '/images/inexistante.jpg', '/uploads/documents/x.pdf', '/etc/passwd', 'https://evil.example/a.jpg']) {
      await request(app).get(`/img?w=480&src=${encodeURIComponent(src)}`).expect(404);
    }
  });

  it('activités historiques : galerie ordonnée, date au mois près, jamais présentées comme en cours', async () => {
    const admin = await as('content');
    for (const { input } of historicalActivities) {
      assert.equal(input.status, 'completed');
      const item = (await admin.post('/api/admin/projects').send(input).expect(201)).body;
      assert.deepEqual(item.gallery.map((p) => p.url), input.gallery.map((p) => p.url));
    }
    const pyron = historicalActivities.find((a) => a.input.location.fr === 'Pyron').input;
    assert.equal(pyron.datePrecision, 'month');
    const urls = historicalActivities.flatMap((a) => a.input.gallery.map((p) => p.url));
    assert.equal(new Set(urls).size, urls.length, 'chaque photo appartient à une seule activité');
    assert.equal(urls.some((u) => u.includes('Auxcayes')), false);
  });

  it('enregistre les photos de page avec leurs légendes', async () => {
    const admin = await as('content');
    const body = {
      heroImageUrl: pagePhotos.heroImageUrl, aboutImageUrl: pagePhotos.aboutImageUrl, imageText: pagePhotos.imageText, storyImage: pagePhotos.storyImage, areaImages: pagePhotos.areaImages,
      presentation: { fr: '', en: '' }, mission: { fr: '', en: '' }, vision: { fr: '', en: '' }, approach: { fr: '', en: '' }, commitment: { fr: '', en: '' }, values: { fr: '', en: '' }, objectives: { fr: '', en: '' },
      aboutIsDraft: true, textOverrides: { fr: {}, en: {} },
    };
    await admin.put('/api/admin/site-content').send(body).expect(200);
    const pub = (await request(app).get('/api/settings').expect(200)).body;
    assert.equal(pub.areaImages.community.url, '/images/09 mars 2014.jpg');
    assert.match(pub.imageText.hero.caption.fr, /2016/);
    await admin.put('/api/admin/site-content').send({ ...body, storyImage: { ...body.storyImage, url: '/images/../x.jpg' } }).expect(400);
  });
});

describe('paramètres du site', () => {
  const settingsBody = (over = {}) => ({
    logoUrl: '', email: 'contact@example.org', phone: '', address: { fr: '', en: '' }, mapUrl: '',
    socials: { facebook: '', instagram: '', x: '', youtube: '', linkedin: '', whatsapp: '' },
    seo: { homeTitle: { fr: '', en: '' }, homeDescription: { fr: '', en: '' }, ogImageUrl: '' },
    englishEnabled: true, maintenance: { enabled: false, message: { fr: '', en: '' } }, notificationEmail: 'alertes@example.org', ...over,
  });
  const contentBody = (over = {}) => ({
    heroImageUrl: '', aboutImageUrl: '',
    presentation: { fr: '', en: '' }, mission: { fr: 'M', en: 'M' }, vision: { fr: '', en: '' }, approach: { fr: '', en: '' }, commitment: { fr: '', en: '' }, values: { fr: '', en: '' }, objectives: { fr: '', en: '' },
    aboutIsDraft: false, textOverrides: { fr: {}, en: {} }, ...over,
  });

  it('ne publie jamais l\'adresse de notification ; le nom officiel ne peut pas être modifié', async () => {
    const admin = await as('super');
    await admin.put('/api/admin/settings').send(settingsBody()).expect(200);
    const pub = (await request(app).get('/api/settings').expect(200)).body;
    assert.equal(pub.email, 'contact@example.org');
    assert.equal(pub.notificationEmail, undefined);
    await admin.put('/api/admin/settings').send(settingsBody({ orgName: 'Autre' })).expect(400);
    const read = (await admin.get('/api/admin/settings').expect(200)).body;
    assert.equal(read.orgName, 'Association pour le Developpement Integral des Valeur Haitiennes (ADIVAH)');
    assert.equal(JSON.stringify(read.mail).includes('pass'), false);
    const viewer = await as('viewer');
    assert.equal((await viewer.get('/api/admin/settings').expect(200)).body.notificationEmail, undefined);
  });

  it('modifie les textes prévus et refuse les autres clés', async () => {
    const content = await as('content');
    await content.put('/api/admin/site-content').send(contentBody({ textOverrides: { fr: { 'home.headline1': 'Nouveau titre' }, en: {} } })).expect(200);
    assert.equal((await request(app).get('/api/settings')).body.textOverrides.fr['home.headline1'], 'Nouveau titre');
    await content.put('/api/admin/site-content').send(contentBody({ textOverrides: { fr: { 'brand.fullName': 'Autre nom' }, en: {} } })).expect(400);
    await content.put('/api/admin/site-content').send(contentBody({ textOverrides: { fr: { 'admin.title': 'x' }, en: {} } })).expect(400);
    await content.put('/api/admin/settings').send(settingsBody()).expect(403);
  });

  it('mode maintenance : bloque le public, laisse passer les administrateurs', async () => {
    const admin = await as('super');
    await admin.put('/api/admin/settings').send(settingsBody({ maintenance: { enabled: true, message: { fr: 'Retour bientôt', en: 'Back soon' } } })).expect(200);
    const res = await request(app).get('/api/projects').expect(503);
    assert.equal(res.body.error.code, 'maintenance');
    await request(app).post('/api/submissions').send({}).expect(503);
    assert.equal((await request(app).get('/api/settings').expect(200)).body.maintenance.enabled, true);
    await admin.get('/api/projects').expect(200);
    await admin.get('/api/admin/stats').expect(200);
  });

  it('envoie un e-mail de test à la personne connectée', async () => {
    const admin = await as('super');
    assert.deepEqual((await admin.post('/api/admin/settings/test-email').set('Origin', ORIGIN).send({}).expect(200)).body, { sent: true });
    assert.deepEqual(testOutbox.at(-1).to, ['super@test.org']);
  });
});
