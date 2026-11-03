# ADIVAH website

Bilingual (French by default, English) institutional website for the **Association pour le Developpement Integral des Valeur Haitiennes (ADIVAH)**, with an administrator dashboard.

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, i18next, Lucide icons |
| Backend | Node.js, Express 5, REST API |
| Database | MongoDB with Mongoose |

## Architecture

```
Browser ──> Express ──┬── /api/*      REST API ──> MongoDB
                      ├── /uploads/*  photographs and PDFs (disk)
                      ├── /sitemap.xml, /robots.txt
                      └── everything else: React app, with per-page SEO tags injected
```

In production a single Node process serves both the API and the website, so there is no CORS to manage. In development, Vite (port 5173) proxies API calls to Express (port 4000). Port 5000 is avoided because macOS AirPlay uses it.

- **Languages:** French lives at `/a-propos`, English at `/en/about`, so search engines can index each language. The interface text is in `client/src/i18n/locales/*.json`; content is stored as `{ fr, en }` in the database. If an English translation is missing, the French text is shown.
- **SEO:** the server writes the title, description, canonical, `hreflang` and social tags into the HTML of each page, so crawlers and social networks can read them without running JavaScript.
- **Sample content:** items flagged `isSample` show an "Exemple à remplacer" badge, are `noindex`, and are left out of the sitemap.

## Folder structure

```
client/
  public/               static files (favicon, optional fixed images)
  scripts/check-i18n.mjs  checks that FR and EN have identical keys
  src/
    admin/              dashboard (loaded separately from the public site)
    components/         layout/, ui/, content/ (cards, forms, sharing)
    config/             brand.js (images), features.js (future features), areas.js
    context/ hooks/ lib/  settings, API client, routes, SEO helpers
    i18n/locales/       fr.json, en.json
    pages/              one file per public page
server/
  src/
    config/             environment validation, database connection
    middleware/         auth, security headers and rate limits, uploads, errors
    models/             User, Project, Article, Publication, Campaign, TeamMember, Partner, Media, AuditLog, Submission, Settings
    routes/             public.js, auth.js, admin/
    seo/                meta tags, sitemap, robots
    lib/                permissions, workflow, audit, mail, notifications
    scripts/            seed.js, createAdmin.js, backup.js, restore.js
    validators/         input validation (Zod)
  test/                 API tests
  uploads/              uploaded files (not in Git, must be backed up)
shared/site.json        URLs and SEO text, used by both client and server
```

## Run it locally

Requires Node 20.19+ and MongoDB running locally (`brew services start mongodb-community@7.0`).

```bash
npm install
cp server/.env.example server/.env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # paste into JWT_SECRET in server/.env
npm run seed                                                               # settings and sample content
npm run create-admin -- --email=you@example.org --name="Your name"         # asks for a password (12+ characters, lowercase, uppercase, number)
npm run dev
```

- Website: http://localhost:5173
- Dashboard: http://localhost:5173/admin

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start API and website with live reload |
| `npm test` | API tests and translation completeness check (MongoDB must be running) |
| `npm run build` | Build the website into `client/dist` |
| `npm start` | Start in production mode |
| `npm run seed` | Reinstall samples. Only items flagged as samples are replaced |
| `npm run create-admin -- --email=… --name=… [--role=super_admin\|content_admin\|editor\|viewer]` | Create an account or reset its password. The default role is `super_admin` |
| `npm run backup` | Create an encrypted backup. Requires `BACKUP_KEY` |
| `npm run restore -- --file=… [--yes]` | Check a backup, or restore it with `--yes` |

## Replacing placeholders

Everything below is done in the dashboard, with no code changes:

- **Logo, contact details, social links, SEO, maintenance mode:** *Settings*.
- **Home image, About image, About texts, page text, areas of work, footer text:** *Website text*.
- **Sample projects, news and publications:** edit or delete them. The dashboard counts how many remain.
- **"Provisional content" notice on the About page:** untick it in *Website text* once the texts are validated.

The photographs on the *Areas of work* page are still placeholders in code: pass `src` to `ImageSlot` in `client/src/pages/Areas.jsx`.

## Adding future features

Flags are in `client/src/config/features.js`. Donations must stay off until official banking or payment information is supplied. Typical pattern for a new feature (newsletter, events, membership): add a model in `server/src/models`, a validator, a route (`crudRoutes` handles admin CRUD), a `RESOURCES` entry in `client/src/admin/pages/Resources.jsx`, a page, and keys in both locale files. A secure reporting channel needs its own security design: the current forms are not suitable for it and say so to visitors.

Form submissions are stored and read in the dashboard. When email is configured, an alert is sent without the message text.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) to publish the site.

## Administrator dashboard

Open `/admin`. Create the first account with `npm run create-admin -- --email=you@example.org --name="Your name"`. Other accounts are created under **Administrators**, and each person chooses their own password from an emailed link.

| | Super Administrator | Content Administrator | Editor | Viewer |
|---|---|---|---|---|
| View content | ✓ | ✓ | ✓ | ✓ |
| Create and edit content, upload files | ✓ | ✓ | ✓ | |
| Approve, reject, publish, schedule, delete content | ✓ | ✓ | | |
| Replace and delete media, edit website text | ✓ | ✓ | | |
| Read messages, change settings, manage accounts, view activity log | ✓ | | | |

The server enforces these rules on every request. The definition is in `server/src/lib/permissions.js`.

**Publishing:** Draft → Pending Review → Approved → Published. A reviewer can reject with a comment, or schedule an approved item. An Editor cannot change a published item, and changing a pending or approved item returns it to Draft. Website text under **Website text** is not part of this approval flow: it goes live when saved.

**Security:** passwords need 12+ characters with lowercase, uppercase and a number. Five failed sign-ins lock an account for 15 minutes. Sessions last 8 hours and end when a password, role or status changes. Uploaded images are re-encoded to remove GPS and other metadata. PDF metadata is not removed. Uploaded files are reachable by anyone with their address, even when the item using them is unpublished.

Backups and email setup are covered in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Tests:** `npm test` runs the API tests and the translation check against a local MongoDB (`adivah_test`).
