# Tentzu waitlist site

## Live

- **Site:** https://aqua-mallard-186909.hostingersite.com
- **Admin:** https://aqua-mallard-186909.hostingersite.com/admin
- Hostinger Business plan, order `1009362459`, account `u857204894`
- MySQL `u857204894_waitlist` on `localhost` (same server as the app)
- Deployed as a Node.js app: Hostinger detects `express` / `server.js` and runs
  `npm install && npm start`. `public/` ships prebuilt — nothing rebuilds the
  React page on the server.

### Redeploying

Rebuild `public/` (see below), zip the directory excluding `node_modules/`,
then `hosting_deployJsApplication`. Environment variables live on the app
itself (`hosting_replaceNode_jsEnvironmentVariablesV1`), not in the archive.
That tool replaces the **whole** set — send every variable each time or the
omitted ones are deleted.

The public landing page plus its signup API, packaged as one Node app so the
page and the endpoint share an origin (no CORS, one deploy, one domain).

## Why this exists separately from `ark-backend`

The Django app in `ark-backend/` owns the same waitlist model and is still the
implementation the mobile app will use. This is a deliberate, self-contained
copy of just the signup path so the public waitlist does not depend on the
Render free tier — whose Postgres is deleted on expiry rather than downgraded.
Behaviour was verified byte-for-byte against the Django endpoint: signup,
idempotent re-submit, referral attribution, position ordering, and the
founding-member cutoff all return identical payloads.

## Layout

| File | Role |
|---|---|
| `server.js` | Express: static site, signup route, CSV export, health |
| `waitlist.js` | Signup logic — validation, referral codes, position, dedupe |
| `db.js` | MySQL pool + `CREATE TABLE IF NOT EXISTS` on boot |
| `public/` | Built frontend, copied from `ark-frontend/dist` (gitignored) |

## Seeing the signups

Go to **`/admin`** and enter `ADMIN_TOKEN`. That is the whole answer — no
database client, no curl. The page lists every signup ranked by referrals,
marks the first 100 as founding members, makes emails `mailto:` links and
phones `wa.me` links, searches across name/email/phone, and downloads a CSV.

The token is exchanged for an httpOnly cookie, so it never appears in a URL,
browser history, or a `Referer` header. If `ADMIN_TOKEN` is unset every admin
route returns 404 rather than defaulting to open.

## Endpoints

- `POST /api/v1/waitlist/?source=landing_page` — signup. Idempotent per email.
- `GET  /admin` — signup dashboard (cookie auth).
- `GET  /admin/export.csv` — CSV download (cookie auth).
- `GET  /api/v1/waitlist/export?token=…` — same CSV for scripts/backups.
- `GET  /api/v1/health/` — status plus a live signup count.

## The CDN caches by URL

Hostinger fronts the app with `hcdn`. It cached `/admin/export.csv` and served a
deleted signup back as though it were still there. Every `/api/` and `/admin`
response now sets `Cache-Control: no-store`, and `index.html` sets `no-cache` so
a redeploy is picked up instead of pointing at bundles that no longer exist.
Only the content-hashed files under `/assets` are allowed a long cache. If you
add a dynamic route outside those prefixes, set the header yourself.

## Responsive layout

Verified with no horizontal overflow from 280px (Galaxy Fold, closed) to 1536px,
in portrait and landscape. Lighthouse mobile: accessibility, best practices and
SEO all 100.

- **Fluid type** — `clamp(2.5rem, min(9vw,11vh), 4.5rem)`. The `min()` against
  `vh` is what stops a landscape phone from rendering a 72px headline on a
  390px-tall viewport; width alone gets that wrong.
- **`svh`, not `vh`/`dvh`** — `100vh` on iOS is the *largest* viewport, so the
  page sat taller than the visible area with the toolbar shown. `dvh` fixes the
  height but resizes mid-scroll as the toolbar slides, which reads as jank.
- **Two scrims** — the `90deg` gradient only makes sense once the copy occupies
  a left column. On one-column layouts it drew a hard vertical seam across the
  page, so narrow viewports get a top-down scrim instead.
- **Intrinsic feature grid** — `repeat(auto-fit, minmax(min(100%,13.5rem),1fr))`
  reflows on its own content with no breakpoints. The `min(100%,…)` is what
  keeps it from overflowing below 216px.
- **Form capped at 30rem** until the two-column breakpoint; it previously
  stretched to ~950px of full-width inputs on iPad.
- **`viewport-fit=cover`** in the meta tag, plus `max(1.25rem, env(safe-area-inset-*))`
  gutters. Without the meta, the `env()` values resolve to 0 on notched iPhones.
- **Hero via `srcset`** — phones fetch 37KB instead of the original 1.6MB PNG.

## robots.txt: Google is blocked on the free subdomain

`https://<name>.hostingersite.com/robots.txt` serves a Hostinger default
containing `User-agent: Googlebot` / `Disallow: /`. The web server answers that
path from the vhost document root *before* proxying to Node, so neither
`public/robots.txt` nor a copy at the archive root overrides it — both were
tried. The correct `robots.txt` ships in the archive and will apply wherever the
platform does not intercept. **Until a custom domain is attached, treat this URL
as un-indexable by Google.** That is fine for a preview link and fatal for a
launch domain, so re-check `/robots.txt` after pointing a real domain at it.

## Handling untrusted input

Signups come from a public form, so both output paths are defended and tested:
HTML is entity-escaped before rendering, and CSV cells beginning `=`, `+`, `-`
or `@` are apostrophe-prefixed so Excel and Sheets will not execute them.
Phone-shaped values are exempt from that guard — they cannot carry a payload,
and quoting them would put a stray apostrophe on the whole phone column.

## Rebuilding the page

```bash
cd ../ark-frontend && VITE_API_URL=/api/v1 npx vite build
cd ../waitlist-site && rm -rf public && mkdir public && cp -R ../ark-frontend/dist/. public/
```

`VITE_API_URL=/api/v1` is what makes the page call its own origin. Building
without it bakes in whatever default the client falls back to.

## Running locally

```bash
npm install
DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=… DB_PASSWORD=… DB_NAME=… \
ADMIN_TOKEN=dev npm start
```
