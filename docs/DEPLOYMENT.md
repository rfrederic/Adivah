# Deploying ADIVAH

The application is one Node.js process plus MongoDB. It needs a server with a **persistent disk**, because uploaded photographs and PDFs are stored on disk. Hosts with temporary file systems will lose uploads on each redeploy unless a persistent volume is attached.

## 1. Database

Use MongoDB Atlas or your own MongoDB server. Create a dedicated database user, restrict network access to your server, and turn on backups.

## 2. Environment variables

Set these on the server, never in Git:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Port the app listens on, e.g. `4000` |
| `MONGODB_URI` | Connection string |
| `JWT_SECRET` | New random value, 48+ bytes. Do not reuse the development one |
| `SITE_URL` | Public address with no trailing slash, e.g. `https://www.example.org`. Must be exact: admin actions from any other origin are refused |
| `TRUST_PROXY` | `1` behind one proxy such as Nginx or a hosting platform. Rate limiting is unreliable if this is wrong |
| `UPLOAD_DIR` | Optional path to the persistent upload folder |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Your email provider's SMTP details. Without `SMTP_HOST` no email is sent, so notifications, invitations and password recovery by email do not work |
| `MAIL_FROM` | Sender, e.g. `ADIVAH <no-reply@example.org>` |
| `BACKUP_KEY` | Random value of 32+ characters that encrypts backups. Store a copy somewhere other than the server: without it, backups cannot be restored |
| `BACKUP_DIR` | Backup folder. Must be outside the application folder |
| `BACKUP_KEEP` | How many backups to keep (default 14) |

## 3. Install and start

```bash
npm ci
npm run build
npm run seed            # first deployment only, if you want the samples
npm run create-admin -- --email=you@example.org --name="Your name"   # first Super Administrator
npm start
```

Other accounts are created in the dashboard under **Administrators**. If you forget the only Super Administrator password and email is not configured, run `create-admin` again with the same email to reset it.

Keep the process running with your platform's service manager, or `pm2 start npm --name adivah -- start`.

## 4. HTTPS

HTTPS is required in production: session cookies only get the `Secure` flag when `SITE_URL` starts with `https://`. Example Nginx configuration (use Certbot for the certificate):

```nginx
server {
  server_name www.example.org;
  client_max_body_size 30m;   # uploads go up to 25 MB
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

The server must keep running continuously for scheduled publications: it checks for due items every minute. Run a single instance, because login limits are held in memory and scheduling is not coordinated between instances.

## 5. Email

Set the `SMTP_*` variables, restart, then go to **Settings → Email configuration** and use **Send me a test email**. Notification emails never contain the text of contact messages, only a prompt to sign in. Your email provider will still see who is notified and when.

## 6. Backups

`npm run backup` writes one encrypted file containing the whole database (content, accounts, settings, messages, activity log) and all uploaded files. The file is only readable by the server account, and the command refuses a folder inside the application. It does **not** include your environment variables: keep those, including `BACKUP_KEY`, in a password manager.

Example daily backup at 02:00, using cron:

```cron
0 2 * * * cd /path/to/app && /usr/bin/npm run backup >> /var/log/adivah-backup.log 2>&1
```

Copy the backup files to a second location, such as encrypted off-site storage. A backup kept only on the same server is lost with that server.

### Restoring

```bash
# 1. Check the file. Nothing is changed.
npm run restore -- --file=/path/to/adivah-DATE.backup

# 2. Stop the application, then restore. This REPLACES the database and the uploads folder.
npm run restore -- --file=/path/to/adivah-DATE.backup --yes

# 3. Start the application again.
npm start
```

A wrong key or a damaged file is refused before anything is changed. Practise a restore on a separate database every few months by pointing `MONGODB_URI` and `UPLOAD_DIR` somewhere else for the command.

## 7. Before opening to the public

- [ ] Delete or replace all samples (the dashboard shows the number left)
- [ ] Upload the logo and photographs
- [ ] Enter the real contact details and social links
- [ ] Validate the About texts, then untick the "provisional content" notice
- [ ] Review the Privacy page, ideally with legal advice
- [ ] Configure email and confirm the test email arrives
- [ ] Schedule `npm run backup`, copy backups off the server, and test a restore
- [ ] Open `/sitemap.xml` and `/robots.txt` on the live domain, then submit the sitemap to Google Search Console
- [ ] Log in over HTTPS and confirm the session cookie is marked `Secure`
- [ ] Have the site independently security tested, given the sensitivity of ADIVAH's work
