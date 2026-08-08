# HANDOFF — Tentzu

**Last updated:** 2026-08-08 (macOS session). Read this first, then `MOBILE.md` and `CLAUDE.md`.
Single source of truth for "what is in flight right now". Local `~/.claude` memory does not
travel between machines, so everything needed is here.

---

## ✅ Nothing is half-done

The temporary egress diagnostic has been removed and deployed — `/api/v1/_diag/egress/`
returns 404. **Production runs `d8afcfd`, matching `origin/main`.** Verified after deploy:
register 201 (~4.4s), `/api/v1/docs/` 200.

Minor leftover, harmless: the `EMAIL_HOST_USER` env var is still set on Render. It is
SMTP-only and SMTP is blocked on this host (see below), so it does nothing. Delete it
whenever convenient.

---

## Repo facts
- GitHub: **`ademola25/kiizzu`** (legacy name; product is **Tentzu**).
- Branch **`main`**, everything pushed. Production runs **`d8afcfd`**; any commits after it on
  `main` are documentation only, so a gap between HEAD and the deployed commit is expected and
  is not drift. Check with `git log --oneline d8afcfd..HEAD`.
- `ark-backend/` Django REST API · `ark-mobile/` Expo RN (active) · `ark-frontend/` frozen web.
- Backend live at **`https://tentzu-api.onrender.com`**.

---

## What was fixed this session

### 1. Invisible buttons on device — FIXED (`3fe9ca6`)
Deep-green primary/nav buttons rendered with no background, label jammed to the left edge,
icon wrapped to a second line. **Release builds only** — dev and web were fine, which is why
it shipped.

Cause: the **function-form `style` prop** (`style={({pressed}) => ({...})}`) is dropped
wholesale in Release — background, padding *and* flexDirection together. Affected exactly the
three components using that form: `welcome.tsx` "Get started", `TentzuButton`, `TentzuOption`.
Fix: plain style objects, press state via `onPressIn`/`onPressOut`.

Reproduced on a Release simulator build and verified fixed on the same. Suspected NativeWind
`cssInterop` intercepting `style` (jsxImportSource is nativewind) but **not isolated to that
library** — if it recurs, start there.

**The earlier "stale build on the phone" theory in this file was WRONG.** `welcome.tsx` has
only ever had one version in git, so the device was running current code.

### 2. Verification codes unreachable — FIXED (`7906260`, `c06e657`)
"We sent a 6-digit code" was false for every user since deploy. Three stacked faults:
1. `production.py` never set `EMAIL_BACKEND` → Django defaulted to SMTP on `localhost:25`.
2. `emails.py` used `fail_silently=True` → the resulting exception was swallowed.
3. Both code screens gated the fallback banner on `__DEV__` → **false in Release**, so the app
   received the code from the API and then refused to display it.

Backend now: explicit `EMAIL_BACKEND`, `EmailDeliveryError` instead of silent failure,
`_send_code` returns `email_delivered`. Mobile now shows the code whenever the server returns
it (server-side `EXPOSE_OTP_CODES` is the real gate; the card disappears by itself once real
delivery works).

### 3. I took production down for ~20 min — FIXED (`c06e657`)
Setting `EMAIL_HOST` without a password made Django open an SMTP socket that never answered.
**Django applies no default SMTP timeout**, so the connect blocked until gunicorn SIGKILLed the
worker — every registration returned 500. Guards added:
- `EMAIL_TIMEOUT` (default 10s).
- SMTP backend requires `EMAIL_HOST` **and** `EMAIL_HOST_PASSWORD`; otherwise console.

### 4. Referral codes shorter than 8 chars — FIXED (`0c8e082`)
`_make_referral_code` stripped `-`/`_` out of `token_urlsafe(6)` *before* truncating, so
**23.4% of codes were 5–7 chars** (measured over 2000 samples), shrinking the keyspace on a
unique column. Now built from an explicit alphabet (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, no
I/L/O/0/1 since these get read aloud and retyped). Existing short codes left alone — still
unique, and shared referral links stay valid.

The old test sampled one code per run so it caught this ~1 run in 4 and read as flaky. Replaced
with 200 generations checked for length and alphabet; verified it fails against the old code.

---

## 🔑 THE ONE THING BLOCKING REAL EMAIL

**Outbound SMTP is blocked on Render.** Measured 2026-08-06 from inside the container:

| Target | Result |
|---|---|
| `smtp.gmail.com:587 / 465 / 25` | OSError 101 Network is unreachable |
| `smtp.resend.com:587` | timeout |
| `api.sendgrid.com:443` | connected, 0.01s |
| `api.resend.com:443` | connected, 0.01s |

**A Gmail app password cannot work here, whatever the credentials.** Do not spend time on one.
Only HTTPS-API providers work.

**Fix: set `SENDGRID_API_KEY`** in Render → `tentzu-api` → Environment. That path is already
coded in `ark/users/emails.py` and `sendgrid==6.11.0` is in `requirements/base.txt`, so no code
change is needed. SendGrid requires Single Sender Verification or domain auth first;
`DEFAULT_FROM_EMAIL` is currently `ademolaayo25@gmail.com` and must match a verified sender.

Once real mail works: set `EXPOSE_OTP_CODES=false`. The on-screen code card then disappears on
its own — **no app rebuild needed**, since it only renders when the server sends a code.

---

## Current state

| Thing | State |
|---|---|
| iOS | Built Release, signed, **installed on DonJohn** (iPhone 14 Pro Max). Contains both fixes; verified by byte-inspecting the bundle. |
| Android APK | https://expo.dev/artifacts/eas/b9axjN1RM6kWGIrobvd8FzYSVr_Fh8UIrRUQtxK-a3Q.apk (from `7906260`) |
| Backend | Live, healthy. Registration 201 in ~4s, `email_delivered: true`, `dev_code` returned. |
| Deployed commit | **`d8afcfd`** — matches `origin/main`, no drift. |
| Tests | 47 passed, backend. `tsc --noEmit` clean, mobile. |

### Render env vars now
`DEFAULT_FROM_EMAIL=ademolaayo25@gmail.com` (was `reminders@tentzu.app`), `EXPOSE_OTP_CODES=true`,
`EMAIL_HOST_USER=ademolaayo25@gmail.com` (delete — SMTP unusable), plus the Django/DB defaults.
`EMAIL_HOST` was removed. No `SENDGRID_API_KEY` yet.

### Render access (NEW — works without the dashboard)
Render CLI installed (`brew install render`, v2.22.0) and **authenticated** — token in
`~/.render/cli.yaml`. The CLI needs an interactive workspace pick, so use the REST API directly
with the key from that file:

```python
import os, yaml, json, urllib.request
key = yaml.safe_load(open(os.path.expanduser("~/.render/cli.yaml")))["api"]["key"]
# GET/POST https://api.render.com/v1/... with Authorization: Bearer <key>
```
Service `tentzu-api` = **`srv-d9pfhs710e5c73d9jvh0`**, owner `tea-cv17o20gph6c73aqcmvg`.
Deploy: `POST services/{id}/deploys {"clearCache":"do_not_clear"}` → poll
`services/{id}/deploys/{depId}` until `live` (~1m20s). Env var: `PUT services/{id}/env-vars/{KEY}`
with `{"value": ...}` (per-key, does not clobber others); `DELETE` the same path to remove.
Logs: `GET logs?ownerId=...&resource=<svcId>&limit=40`.

**Note:** `autoDeploy=yes` but pushes have NOT been triggering deploys (likely the
`rootDir: ark-backend` build filter). **Deploy manually after every backend push.**

### Production database access
Render's free tier has no shell, but the Postgres instance is reachable externally.
Instance `tentzu-db` = **`dpg-d9pffan10e5c73d9d7l0-a`**. Fetch a connection string with
`GET postgres/{id}/connection-info` → `externalConnectionString`, then either use `psycopg`
directly or point Django at it:

```bash
export DATABASE_URL="<externalConnectionString>"
export DJANGO_SETTINGS_MODULE=config.settings.production
export DJANGO_SECRET_KEY=throwaway DJANGO_ALLOWED_HOSTS="*"
# then django.setup() and use the ORM
```
Prefer the **ORM over raw SQL** for deletes so each model's `on_delete` is honoured —
raw SQL will trip foreign keys or silently leave children behind. Wipe the connection
string from disk afterwards; it contains the DB password.

### DB state (cleaned 2026-08-08)
The throwaway accounts created by deploy-polling were removed: **146 rows** —
36 `users.User`, 36 `billing.Subscription`, 37 `users.OneTimeCode`,
37 `token_blacklist.OutstandingToken`. Users went **37 → 1**.

Scoped on `email LIKE '%@example.com'` (RFC 2606 reserved domain — cannot be a real
person), *not* on the `probe*`/`dep*`/`flow*` prefixes, which could collide with a genuine
signup. Guarded by assertions that abort if any non-test address, the real account, or any
staff/superuser lands in scope. Verified afterwards: zero orphans in every child table, no
leases/documents/payments/reminders were ever attached, `/api/v1/docs/` 200, login 401 on a
bad password.

**The only remaining user is `ademolaayo25@gmail.com` (id=2)** — currently
`email_verified=False`, `onboarding_complete=False`. To use it for real testing, run through
verification; the code shows on-screen while `EXPOSE_OTP_CODES=true`.

The 3 `waitlist_waitlistsignup` rows are the referral-code fix verification and were kept.

Gotcha for next time: SimpleJWT's `OutstandingToken.user` is `on_delete=SET_NULL`, so
deleting a user leaves the token row behind with a NULL user rather than cascading. Those
rows are inert but accumulate — flush with
`OutstandingToken.objects.filter(user__isnull=True).delete()`.

---

## Known-good verification recipes

- **iOS device build + install** (free Personal Team, expires ~7 days):
  ```bash
  cd ark-mobile/ios
  export EXPO_PUBLIC_API_URL="https://tentzu-api.onrender.com/api/v1"   # else .env bakes a LAN IP
  xcodebuild -workspace Tentzu.xcworkspace -scheme Tentzu -configuration Release \
    -destination "id=F77FF8AB-FF3A-5485-85E1-CB10121416EC" \
    -allowProvisioningUpdates DEVELOPMENT_TEAM=8B748JDU2V CODE_SIGN_STYLE=Automatic \
    -derivedDataPath build build
  xcrun devicectl device install app --device F77FF8AB-FF3A-5485-85E1-CB10121416EC \
    "build/Build/Products/Release-iphoneos/Tentzu.app"
  ```
  Entitlements must stay an empty dict (`ios/Tentzu/Tentzu.entitlements`) — free teams cannot
  sign `aps-environment`. Any `expo prebuild` re-adds it.

- **Checking strings in a Release bundle:** Hermes stores any string containing a non-ASCII
  char (em-dash, `·`) as **UTF-16**, so plain `strings` will not find it and its absence proves
  nothing. Search the raw bytes for both `utf-8` and `utf-16-le`.

- **Reproducing Release-only UI bugs:** `npx expo run:ios --configuration Release`. Debug builds
  and the web export will not show them. Expo Go's dev-menu sheet blocks the simulator and
  cannot be dismissed without Terminal Accessibility permission — a Release build avoids it.

---

## Still open

1. **`SENDGRID_API_KEY`** — the only thing between you and real emails.
2. **`(auth)` / `(tabs)` screens have never been visually verified in a Release build.** Static
   audit found nothing (no function-form styles left, all Tailwind classes resolve, no dynamic
   classNames, `Card`/`PillButton` forward className correctly) — but static reasoning said the
   same about the onboarding buttons right up until Release proved otherwise. Fastest check is
   tapping through on the phone.
3. Android bundle verification (`expo export --platform android`) not run this session; only
   iOS was exercised locally. CLAUDE.md asks for both at phase end.
4. Backend follow-ups unchanged — `/push/register/`, Expo push dispatch, real Stripe price IDs,
   `/billing/portal/`, reminder task consulting `Subscription.tier`. See MOBILE.md.

---

## Conventions (from CLAUDE.md — obey)
- Never add Claude as a git co-author.
- Commit/push only when asked.
- Mirror the design faithfully first; content/branding swaps after.
