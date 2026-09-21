# EMS — Deployment & Configuration Guide

This document covers everything needed to run the Elite Media Solutions site in
production: hosting requirements, environment variables, the daily blog
automation, and connecting `elitemedia.qa`.

---

## 1. What this project needs from a host

| Requirement | Value |
|---|---|
| Runtime | **Node.js 20 or newer** |
| Framework | Next.js 16 (App Router) |
| Rendering | **Server-side** — this is *not* a static site |
| Build command | `npm ci && npm run build` |
| Start command | `npm run start` (serves on `$PORT`, default 3000) |
| Persistent disk | **Required** — articles are written to `content/posts/` |

> **Important:** the site has server-side API routes (`/api/send-contact`,
> `/api/cron/generate`, `/api/admin/*`) and file-backed blog storage. It cannot
> be deployed as a static export or on PHP-only shared hosting. On Hostinger this
> means a **VPS** or a plan with **Node.js application** support.

### Why not static export?

`next build` reports these as dynamic (`ƒ`) routes — they execute per request:

```
ƒ /api/send-contact      Telegram lead delivery
ƒ /api/cron/generate     daily article generation
ƒ /api/admin/*           content management
ƒ /admin                 protected dashboard
```

### A note on Vercel

This repository is already connected to Vercel, and pushes build previews there
successfully. **The site renders correctly on Vercel, but AI article generation
will not work there.** Vercel's serverless filesystem is read-only apart from an
ephemeral `/tmp`, so `content/posts/` cannot be written to.

Concretely, on Vercel:

- The marketing site, service pages and contact form all work normally.
- The blog **displays** any articles committed to the repository.
- `/api/cron/generate` and the admin "Generate" button return a clear
  `503 Article storage is not writable on this host`, rather than failing
  obscurely part-way through.

Three ways forward, in order of effort:

1. **Host on a VPS or Node plan with a persistent disk** (what section 3
   describes). Everything works as designed, nothing changes.
2. **Keep Vercel and generate elsewhere.** Run generation on a machine with a
   disk, commit the resulting JSON in `content/posts/`, and let Vercel rebuild.
   The blog stays fully static and fast.
3. **Swap the store for a database.** `lib/blog/store.js` has a deliberately
   narrow interface — `getAllArticles`, `getArticleBySlug`, `saveArticle`,
   `deleteArticle`, `getContentFingerprint`. Reimplementing those against
   Postgres, Vercel KV or similar requires no changes to any page or component.

This is a decision about where the site should live; it is not a defect in the
code. Pick a direction before enabling the daily cron.

---

## 2. Environment variables

Copy `.env.example` to `.env.local` locally. In production, enter the same
variables in your host's environment configuration — **never commit them**.

### Required for lead capture

| Variable | Where to get it |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Message **@BotFather** on Telegram → `/newbot` |
| `TELEGRAM_CHAT_ID` | Message **@userinfobot** (personal), or add the bot to a group, post a message, and read the `chat.id` from `https://api.telegram.org/bot<TOKEN>/getUpdates` (group ids are negative) |

### Required for the AI blog

| Variable | Notes |
|---|---|
| `AI_PROVIDER` | `anthropic` (default), `openai`, or `openai-compatible` |
| `AI_API_KEY` | Your provider API key |
| `AI_MODEL` | Defaults to `claude-opus-5` on Anthropic |
| `CRON_SECRET` | Long random string — `openssl rand -hex 32` |

### Required for the admin area

| Variable | Notes |
|---|---|
| `ADMIN_USER` | Any username |
| `ADMIN_PASSWORD` | Use a strong password |

If either is unset, `/admin` returns **503** and stays closed — it never
defaults to open.

### Site + cost controls

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://elitemedia.qa` | Canonical URLs, OG tags, sitemap |
| `BLOG_ARTICLES_PER_DAY` | `1` | Articles published per cron run |
| `BLOG_MAX_ARTICLES_PER_RUN` | `3` | Hard ceiling regardless of request |
| `BLOG_MAX_WORDS` | `1100` | Target article length |
| `AI_MAX_OUTPUT_TOKENS` | `8000` | Ceiling per model call |

---

## 3. Hostinger deployment

### If you have a VPS

```bash
# 1. Install Node 20+ and a process manager
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. Clone and build
git clone https://github.com/louai617/elitedigitalservices.git /var/www/ems
cd /var/www/ems
npm ci
npm run build

# 3. Create the production environment file
nano .env.local        # paste the variables from section 2
chmod 600 .env.local   # readable only by the owner

# 4. Start under a process manager so it survives reboots
pm2 start "npm run start" --name ems
pm2 save
pm2 startup            # run the command it prints
```

Then put Nginx in front, terminating TLS and proxying to the app:

```nginx
server {
    server_name elitemedia.qa www.elitemedia.qa;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

`X-Forwarded-For` matters: the contact form's rate limiter reads it to identify
clients. Without it every visitor looks like one IP.

Issue the certificate:

```bash
sudo certbot --nginx -d elitemedia.qa -d www.elitemedia.qa
```

### If you have a Node.js hosting plan (hPanel)

In **hPanel → Websites → Node.js**, set:

- **Node version:** 20 or higher
- **Application root:** the repository directory
- **Startup file / command:** `npm run start`
- **Build command:** `npm ci && npm run build`
- **Environment variables:** add every variable from section 2

Then enable SSL under **Hosting → SSL** (Let's Encrypt) and force HTTPS.

---

## 4. Daily blog automation

The generation endpoint is protected by `CRON_SECRET`. Trigger it once a day.

**Hostinger cron (hPanel → Advanced → Cron Jobs)** — daily at 06:00:

```
0 6 * * * curl -fsS -X POST https://elitemedia.qa/api/cron/generate -H "Authorization: Bearer YOUR_CRON_SECRET" >> /home/USER/logs/ems-blog.log 2>&1
```

**VPS crontab** (`crontab -e`) — same line.

If your cron UI cannot send headers, the secret is also accepted as a query
parameter:

```
https://elitemedia.qa/api/cron/generate?secret=YOUR_CRON_SECRET
```

### Verifying a generation run

```bash
curl -X POST https://elitemedia.qa/api/cron/generate \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
```

A successful run returns the slug, title, category, model and token usage for
each article. Errors are reported in the `errors` array rather than silently
swallowed.

---

## 5. Connecting elitemedia.qa (registered at Routedge)

Choose **one** of these two approaches.

### Option A — point DNS at Hostinger (keeps DNS at Routedge)

In the Routedge DNS manager for `elitemedia.qa`, set:

| Type | Name | Value |
|---|---|---|
| A | `@` | your Hostinger server's IPv4 address |
| A (or CNAME) | `www` | same IPv4, or CNAME to `elitemedia.qa` |

### Option B — delegate DNS to Hostinger

Change the nameservers at Routedge to the pair Hostinger shows under
**Hosting → Domains → DNS / Nameservers** (typically `ns1.dns-parking.com` and
`ns2.dns-parking.com` — **use the values your own panel displays**, not these).

> With Option B, recreate any existing email records in Hostinger's DNS editor
> *before* switching, or mail will break during the cutover.

### Records you must NOT remove

Before changing anything, export or screenshot the current zone. Leave these
untouched unless you are deliberately migrating them:

- `MX` records (mail delivery)
- `TXT` SPF records (`v=spf1 ...`)
- `TXT`/`CNAME` DKIM selectors (e.g. `default._domainkey`)
- `TXT` DMARC (`_dmarc`)
- Any `TXT` domain-verification records
- Records for existing subdomains already in use

Only the `@` and `www` records need to change to point the website.

### Verifying

```bash
dig +short elitemedia.qa A
dig +short www.elitemedia.qa
dig +short elitemedia.qa MX      # confirm mail records survived

curl -I https://elitemedia.qa    # expect HTTP/2 200
```

DNS changes can take up to 24–48 hours to propagate. **Do not repeatedly edit
records while waiting** — verify, then wait.

---

## 6. Post-deployment checklist

- [ ] `https://elitemedia.qa` loads with a valid certificate
- [ ] `https://www.elitemedia.qa` resolves and redirects consistently
- [ ] Submit a real test lead — confirm it arrives in Telegram
- [ ] Submit an invalid form — confirm errors show and nothing is sent
- [ ] `/admin` prompts for credentials and rejects wrong ones
- [ ] `curl -X POST .../api/cron/generate` without the secret returns **401**
- [ ] Trigger one generation run and confirm the article appears at `/blog`
- [ ] `https://elitemedia.qa/sitemap.xml` lists the new article
- [ ] `https://elitemedia.qa/robots.txt` points at the sitemap
- [ ] Submit the sitemap in Google Search Console
- [ ] Confirm `.env.local` is not web-accessible: `curl https://elitemedia.qa/.env.local` → 404

---

## 7. Security notes

- `TELEGRAM_BOT_TOKEN` and `AI_API_KEY` are read only in server code
  (`lib/telegram.js`, `lib/blog/ai-provider.js`). They are never sent to the
  browser — no `NEXT_PUBLIC_` prefix, so Next.js cannot inline them into a
  client bundle.
- The contact API builds the Telegram message **server-side from validated
  fields**. A client cannot inject arbitrary message content.
- The form never reports success unless Telegram confirms delivery.
- `/admin` and `/api/admin/*` are gated in `proxy.js` before any handler runs.
- `/api/cron/generate` requires `CRON_SECRET` and caps articles per run.
