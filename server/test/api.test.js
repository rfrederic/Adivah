process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/adivah_test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-test';
process.env.SITE_URL = 'http://localhost:5173';

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'adivah-test-'));
process.env.UPLOAD_DIR = uploadDir;

const { default: bcrypt } = await import('bcryptjs');
const { default: mongoose } = await import('mongoose');
const { default: request } = await import('supertest');
const { createApp } = await import('../src/app.js');
const { connectDb } = await import('../src/config/db.js');
const { Project } = await import('../src/models/Project.js');
const { Submission } = await import('../src/models/Submission.js');
const { User } = await import('../src/models/User.js');

const PASSWORD = 'mot-de-passe-de-test-solide';
const ORIGIN = 'http://localhost:5173';
const { default: sharp } = await import('sharp');
const PNG = await sharp({ create: { width: 4, height: 4, channels: 3, background: 'white' } }).png().toBuffer();
const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');

let app;
let hash;

const agentFor = async (email = 'admin@test.org') => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').set('Origin', ORIGIN).send({ email, password: PASSWORD }).expect(200);
  return agent;
};
const projectBody = (overrides = {}) => ({
  title: { fr: 'Projet été à Jacmel', en: 'Summer project' },
  status: 'planned',
  category: 'education',
  ...overrides,
});
/** Crée un contenu et le fait passer par le circuit complet jusqu'à la mise en ligne. */
const publish = async (agent, resource, body) => {
  const item = (await agent.post(`/api/admin/${resource}`).send(body).expect(201)).body;
  await agent.post(`/api/admin/${resource}/${item._id}/approve`).send({}).expect(200);
  return (await agent.post(`/api/admin/${resource}/${item._id}/publish`).send({}).expect(200)).body;
};
const contactBody = (overrides = {}) => ({
  name: 'Marie Test',
  email: 'marie@example.org',
  message: 'Bonjour, ceci est un message de test.',
  consent: true,
  website: '',
  elapsedMs: 8000,
  ...overrides,
});

before(async () => {
  await connectDb(process.env.MONGODB_URI);
  hash = await bcrypt.hash(PASSWORD, 4);
  app = createApp();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  await Promise.all([User, Project, Submission].map((M) => M.init()));
  await User.create([
    { name: 'Admin', email: 'admin@test.org', passwordHash: hash, role: 'super_admin' },
    { name: 'Editor', email: 'editor@test.org', passwordHash: hash, role: 'editor' },
  ]);
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await fs.rm(uploadDir, { recursive: true, force: true });
});

describe('sécurité et authentification', () => {
  it('pose les en-têtes de sécurité', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.ok(res.headers['content-security-policy'].includes("default-src 'self'"));
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-powered-by'], undefined);
  });

  it('refuse les routes admin sans session', async () => {
    for (const url of ['/api/admin/stats', '/api/admin/projects', '/api/admin/submissions']) {
      const res = await request(app).get(url).expect(401);
      assert.equal(res.body.error.code, 'unauthorized');
    }
  });

  it('refuse un mauvais mot de passe et un compte inconnu avec la même erreur', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'admin@test.org', password: 'faux' }).expect(401);
    const b = await request(app).post('/api/auth/login').send({ email: 'x@test.org', password: 'faux' }).expect(401);
    assert.deepEqual(a.body, b.body);
  });

  it('résiste à une injection NoSQL à la connexion', async () => {
    await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } }).expect(400);
  });

  it('pose un cookie httpOnly SameSite=Strict et ne renvoie jamais le hash', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.org', password: PASSWORD }).expect(200);
    const cookie = res.headers['set-cookie'][0];
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.equal(JSON.stringify(res.body).includes('passwordHash'), false);
  });

  it('rejette une requête admin venant d\'une autre origine', async () => {
    const agent = await agentFor();
    await agent.post('/api/admin/projects').set('Origin', 'https://malveillant.example').send(projectBody()).expect(403);
  });

  it('rejette un jeton falsifié', async () => {
    await request(app).get('/api/auth/me').set('Cookie', 'adivah_session=abc.def.ghi').expect(401);
  });

  it('le changement de mot de passe invalide les anciennes sessions', async () => {
    const stale = await agentFor();
    const agent = await agentFor();
    await agent.post('/api/auth/change-password').send({ currentPassword: 'mauvais', newPassword: 'Nouveau-mot-de-passe-1' }).expect(400);
    await agent.post('/api/auth/change-password').send({ currentPassword: PASSWORD, newPassword: 'Nouveau-mot-de-passe-1' }).expect(200);
    await agent.get('/api/auth/me').expect(200);
    await stale.get('/api/auth/me').expect(401);
  });

  it('réserve les messages et les paramètres aux administrateurs', async () => {
    const editor = await agentFor('editor@test.org');
    await editor.get('/api/admin/submissions').expect(403);
    await editor.get('/api/admin/projects').expect(200);
    const settings = (await editor.get('/api/admin/settings').expect(200)).body;
    assert.ok(settings.mission.fr);
    await editor.put('/api/admin/settings').send({}).expect(403);
  });
});

describe('contenus', () => {
  it('crée, publie, retire et supprime un projet ; génère un slug sans accents', async () => {
    const agent = await agentFor();
    const created = await publish(agent, 'projects', projectBody());
    assert.equal(created.slug, 'projet-ete-a-jacmel');
    const second = (await agent.post('/api/admin/projects').send(projectBody()).expect(201)).body;
    assert.equal(second.slug, 'projet-ete-a-jacmel-2');
    const pub = (await request(app).get(`/api/projects/${created.slug}`).expect(200)).body;
    assert.equal(pub.title.en, 'Summer project');
    await agent.post(`/api/admin/projects/${created._id}/unpublish`).send({}).expect(200);
    await request(app).get(`/api/projects/${created.slug}`).expect(404);
    await agent.delete(`/api/admin/projects/${created._id}`).expect(204);
    await agent.delete(`/api/admin/projects/${created._id}`).expect(404);
  });

  it('valide les contenus et refuse les champs inconnus', async () => {
    const agent = await agentFor();
    const res = await agent.post('/api/admin/projects').send(projectBody({ title: { fr: '', en: '' } })).expect(400);
    assert.ok(res.body.error.fields['title.fr']);
    await agent.post('/api/admin/projects').send(projectBody({ slug: 'force' })).expect(400);
    await agent.post('/api/admin/projects').send(projectBody({ image: { url: 'https://evil.example/x.png' } })).expect(400);
    // La mise en ligne passe obligatoirement par le circuit de validation.
    await agent.post('/api/admin/projects').send(projectBody({ published: true })).expect(400);
  });

  it('filtre les projets et masque les brouillons', async () => {
    const agent = await agentFor();
    await publish(agent, 'projects', projectBody());
    await publish(agent, 'projects', projectBody({ category: 'community', status: 'ongoing' }));
    await agent.post('/api/admin/projects').send(projectBody()).expect(201);
    assert.equal((await request(app).get('/api/projects')).body.total, 2);
    assert.equal((await request(app).get('/api/projects?category=community')).body.total, 1);
    assert.equal((await request(app).get('/api/projects?status=ongoing&category=education')).body.total, 0);
    await request(app).get('/api/projects?category=inconnue').expect(400);
    // Express 5 ne construit pas d'objet à partir de la requête : l'opérateur n'atteint jamais MongoDB.
    assert.equal((await request(app).get('/api/projects?category[$ne]=education')).body.total, 2);
  });

  it('date automatiquement un article réel à sa publication, jamais un exemple', async () => {
    const agent = await agentFor();
    const base = { title: { fr: 'Annonce', en: '' }, category: 'announcement' };
    const real = await publish(agent, 'articles', base);
    assert.ok(real.publishedAt);
    const sample = await publish(agent, 'articles', { ...base, isSample: true });
    assert.equal(sample.publishedAt, null);
  });
});

describe('fichiers', () => {
  it('accepte une vraie image ; le fichier reste dans la médiathèque tant qu\'il n\'y est pas supprimé', async () => {
    const agent = await agentFor();
    const { url, _id } = (await agent.post('/api/admin/uploads/image').attach('file', PNG, 'photo.png').expect(201)).body;
    assert.match(url, /^\/uploads\/images\/[a-f0-9-]+\.png$/);
    await request(app).get(url).expect(200).expect('x-content-type-options', 'nosniff');
    const project = (await agent.post('/api/admin/projects').send(projectBody({ image: { url, alt: { fr: 'Photo', en: 'Photo' } } })).expect(201)).body;
    await agent.delete(`/api/admin/media/${_id}`).expect(409);
    await agent.delete(`/api/admin/projects/${project._id}`).expect(204);
    await request(app).get(url).expect(200);
    await agent.delete(`/api/admin/media/${_id}`).expect(204);
    await request(app).get(url).expect(404);
  });

  it('refuse un faux fichier image et un SVG, quel que soit le nom annoncé', async () => {
    const agent = await agentFor();
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    const res = await agent.post('/api/admin/uploads/image').attach('file', html, { filename: 'x.png', contentType: 'image/png' }).expect(400);
    assert.equal(res.body.error.code, 'file_type');
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    await agent.post('/api/admin/uploads/image').attach('file', svg, { filename: 'x.svg', contentType: 'image/svg+xml' }).expect(400);
  });

  it('n\'accepte que des PDF pour les documents et refuse les téléversements anonymes', async () => {
    const agent = await agentFor();
    await agent.post('/api/admin/uploads/document').attach('file', PDF, 'rapport.pdf').expect(201);
    await agent.post('/api/admin/uploads/document').attach('file', PNG, 'rapport.pdf').expect(400);
    await request(app).post('/api/admin/uploads/document').attach('file', PDF, 'rapport.pdf').expect(401);
  });

  it('applique la limite de taille', async () => {
    const agent = await agentFor();
    const big = Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]);
    const res = await agent.post('/api/admin/uploads/image').attach('file', big, 'grande.png').expect(400);
    assert.equal(res.body.error.code, 'file_too_large');
  });
});

describe('formulaires', () => {
  it('enregistre un message valide et le rend consultable par un admin', async () => {
    await request(app).post('/api/submissions').send(contactBody({ type: 'volunteer' })).expect(201);
    const agent = await agentFor();
    const list = (await agent.get('/api/admin/submissions?type=volunteer').expect(200)).body;
    assert.equal(list.total, 1);
    assert.equal(list.items[0].status, 'new');
    assert.ok(list.items[0].consentAt);
    await agent.patch(`/api/admin/submissions/${list.items[0]._id}`).send({ status: 'read' }).expect(200);
    await agent.delete(`/api/admin/submissions/${list.items[0]._id}`).expect(204);
  });

  it('renvoie les champs invalides et exige le consentement', async () => {
    const res = await request(app).post('/api/submissions').send(contactBody({ email: 'pas-un-email', message: 'court' })).expect(400);
    assert.ok(res.body.error.fields.email);
    assert.ok(res.body.error.fields.message);
    await request(app).post('/api/submissions').send(contactBody({ consent: false })).expect(400);
  });

  it('ignore silencieusement les robots (champ piège ou envoi trop rapide)', async () => {
    await request(app).post('/api/submissions').send(contactBody({ website: 'http://spam.example' })).expect(201);
    await request(app).post('/api/submissions').send(contactBody({ elapsedMs: 100 })).expect(201);
    assert.equal(await Submission.countDocuments(), 0);
  });

  it('limite le nombre d\'envois', async () => {
    const limited = createApp();
    const statuses = [];
    for (let i = 0; i < 11; i += 1) {
      statuses.push((await request(limited).post('/api/submissions').send(contactBody())).status);
    }
    assert.equal(statuses.at(-1), 429);
  });
});

describe('SEO', () => {
  it('robots.txt et sitemap : hreflang présents, exemples exclus', async () => {
    const robots = await request(app).get('/robots.txt').expect(200);
    assert.match(robots.text, /Sitemap: http:\/\/localhost:5173\/sitemap\.xml/);
    const agent = await agentFor();
    await publish(agent, 'projects', projectBody());
    await publish(agent, 'projects', projectBody({ title: { fr: 'Exemple', en: '' }, isSample: true }));
    const map = await request(app).get('/sitemap.xml').expect(200);
    assert.match(map.text, /\/en\/about/);
    assert.match(map.text, /hreflang="en"/);
    assert.match(map.text, /\/projets\/projet-ete-a-jacmel/);
    assert.equal(map.text.includes('/projets/exemple'), false);
  });
});
