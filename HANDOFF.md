# HANDOFF — continue Tentzu on Windows

**Written:** 2026-08-05, from the macOS session. Read this first, then `MOBILE.md` and `CLAUDE.md`.
This file is the single source of truth for "what is in flight right now." The local
`~/.claude` memory does **not** travel between machines, so every fact you need is here.

---

## Repo facts
- GitHub: **`ademola25/kiizzu`** (name is legacy; the product was renamed **KIZU/Kizzu → Tentzu** everywhere in code, images, app.json).
- Branch: **`main`**. Everything is committed + pushed. HEAD at write time: `c03a435` (+ this HANDOFF commit on top).
- Layout: `ark-backend/` (Django REST API), `ark-mobile/` (Expo RN — **the active focus**), `ark-frontend/` (frozen web).
- **Mobile only.** Web (`ark-frontend`) is frozen. Native is the source of truth — do not "verify" via the web export.

## The product
Tentzu — Dubai tenant rent-cheque reminder app (WhatsApp/email/SMS). Mirrors the Cal AI design
language but rebranded turquoise (`primary #006a6a`) with a mascot. Mobile ships **iOS + Android**
as equal first-class targets.

---

## 🔴 IN FLIGHT — finish this first

### 1. Deploy the backend on Render (NOT done yet)
The user *thought* it was deployed, but the Render dashboard shows **no `tentzu-api` service** —
the Blueprint was never applied. `render.yaml` is at the repo root and ready. Steps (browser, user does it):
1. Render dashboard → **＋ New → Blueprint** → pick repo **`ademola25/kiizzu`**.
2. Render reads `render.yaml` → creates **`tentzu-db`** (free Postgres) + **`tentzu-api`** (free Python web).
3. **Apply**, wait ~5–10 min for first deploy (install → collectstatic → migrate → gunicorn) → **Live**.
4. Verify: open `https://tentzu-api.onrender.com/api/v1/docs/` (Swagger UI).
   - If Render appended a suffix (e.g. `tentzu-api-xxxx.onrender.com`), the baked APK URL is wrong →
     update `ark-mobile/eas.json` `preview.env.EXPO_PUBLIC_API_URL` and rebuild the APK.
- Free tier cold-starts (~50s first hit) and the free Postgres expires ~30 days after creation.
- `EXPOSE_OTP_CODES="true"` is set in `render.yaml` **for testing only** — it returns the email
  verify / password-reset code in the API response so testers can verify without a mail provider.
  **Turn this off (and configure `SENDGRID_API_KEY`) before real users.**

### 2. Android APK build (was in progress)
- EAS build ID **`8c823140-e711-49c9-aa5f-1baf59d63d85`** (profile `preview`, internal distribution, `apk`).
- Page: https://expo.dev/accounts/ademola25/projects/ark-mobile/builds/8c823140-e711-49c9-aa5f-1baf59d63d85
- Check status: `cd ark-mobile && npx --yes eas-cli build:view 8c823140-e711-49c9-aa5f-1baf59d63d85`
- It **bakes in** `https://tentzu-api.onrender.com/api/v1`. If the live Render URL differs, this APK
  is useless → fix `eas.json` and rebuild: `npx --yes eas-cli build --platform android --profile preview`.
- EAS account: **ademola25**. Expo project: `@ademola25/ark-mobile`, projectId `194109ba-2bb7-4b78-a25a-7f9c6429a362`.
- On Windows, EAS build works the same (it's a cloud build). `npx --yes eas-cli login` first if needed.

---

## What was just built (recent work, all merged)
- **Rename** KIZU/Kizzu → **Tentzu** across code, copy, images, `app.json` (name "Tentzu",
  bundle/package `com.tentzu.app`), mascot app icon.
- **Survey-first onboarding** — new users start in onboarding and register LAST; dashboard is gated
  until register + login. Routes in `ark-mobile/src/app/(onboarding)/`:
  `welcome → home → pattern → rent → due-date → reminders → plan → save (register/login account wall)
  → verify-email (OTP) → celebrate`. Mascots on welcome/reminders + verify/celebrate.
- **Email verification + password reset** (backend `ark-backend/ark/users/` — `OneTimeCode` hashed
  6-digit codes; endpoints `/auth/email/verify/`, `/auth/email/verify/resend/`, `/auth/password/reset/`,
  `/auth/password/reset/confirm/`). Mobile: `(onboarding)/verify-email.tsx`, `(auth)/forgot-password.tsx`.
- **Document vault** — upload/keep tenancy contract, Emirates ID, passport, license (`ark-backend/ark/documents/`,
  local signed-URL storage, no S3 needed for testing). Tab: `(tabs)/documents.tsx`.
- **Paid/unpaid rent** — `POST /payment-schedules/{id}/mark-paid/` + mark-funds-ready on the dashboard.
- **Immersive Dubai backdrop** — `src/components/onboarding/TentzuBackground.tsx` (SVG skyline + Burj +
  dawn gradient), applied to onboarding and the tab screens (`(tabs)/_layout.tsx` wraps `<Tabs>` in it).

## Stack (quick)
- Mobile: Expo SDK ~56, RN 0.85.3, React 19, TypeScript, expo-router, NativeWind 4, TanStack Query 5,
  Zustand 5, Axios (JWT-aware). Hermes + New Arch + React Compiler.
- Backend: Django 5.2, DRF, SimpleJWT, Celery + Redis, PostgreSQL, gunicorn, WhiteNoise, argon2, drf-spectacular.
- Mobile API base default is `http://localhost:8000/api/v1` (`src/lib/api.ts`); prod URL comes from
  `EXPO_PUBLIC_API_URL` (set per EAS profile in `eas.json`).

## Run locally (for reference)
- Backend: `cd ark-backend`, activate venv, `python manage.py migrate && python manage.py runserver 0.0.0.0:8001`.
  (Local dev has historically used backend port **8001**, Expo **8081**.)
- Mobile: `cd ark-mobile && npx expo start` → `a` (Android emulator), `i` (iOS sim, mac only), or Expo Go QR.
- To point the app at local backend from a device, set `EXPO_PUBLIC_API_URL` in `ark-mobile/.env`.

## Gotchas carried over
- iOS free-team Personal signing can't provision Push (`aps-environment`) — mac-only concern; irrelevant on Windows.
- `expo-notifications` plugin was removed from `app.json`; push token is captured but not synced to backend yet.
- Route gate lives in `src/app/index.tsx` + repeated in `(tabs)/_layout.tsx` so deep links can't skip onboarding.

## Conventions (from CLAUDE.md — obey)
- Never add Claude as a git co-author.
- Commit/push only when the user asks.
- Mirror the design faithfully first; content/branding swaps after.

## Open follow-ups (backend-side, non-blocking) — see MOBILE.md "Honest backend dependencies" table
Stripe price IDs are placeholders (checkout 502s), no `/billing/portal/`, no `/push/register/`,
reminder task doesn't dispatch Expo push or consult tier. All disclosed honestly in the UI.
