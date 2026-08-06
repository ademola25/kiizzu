# HANDOFF — continue Tentzu on Windows

**Written:** 2026-08-05, from the macOS session. Read this first, then `MOBILE.md` and `CLAUDE.md`.
This file is the single source of truth for "what is in flight right now." The local
`~/.claude` memory does **not** travel between machines, so every fact you need is here.

---

## Repo facts
- GitHub: **`ademola25/kiizzu`** (name is legacy; the product was renamed **KIZU/Kizzu → Tentzu** everywhere in code, images, app.json).
- Branch: **`main`**. Everything is committed + pushed. Latest handoff commit: `b3b560d` (pull `main` to get it).
- Layout: `ark-backend/` (Django REST API), `ark-mobile/` (Expo RN — **the active focus**), `ark-frontend/` (frozen web).
- **Mobile only.** Web (`ark-frontend`) is frozen. Native is the source of truth — do not "verify" via the web export.

## The product
Tentzu — Dubai tenant rent-cheque reminder app (WhatsApp/email/SMS). Mirrors the Cal AI design
language but rebranded turquoise (`primary #006a6a`) with a mascot. Mobile ships **iOS + Android**
as equal first-class targets.

---

## 🟠 ACTIVE INVESTIGATION (2026-08-06) — "invisible deep-green nav buttons" bug

**Symptom (user, on real iPhone standalone build):** the deep-green (`#006a6a`) primary/nav
buttons and green fills render with **no background** — white label text floats on the light
backdrop, nearly invisible. Happens on **every** onboarding page; user has to guess-tap. The
"Get started" button on Welcome is the flagship example.
- User's device screenshot saved in repo: `ark-mobile/screenshots/device-report-welcome-invisible-buttons.jpeg`
- The web/Playwright screenshots I took earlier showed the teal buttons FINE — so it's a web-vs-native (or stale-build) discrepancy.

**What I found in the CODE (all committed, HEAD):**
- Onboarding screens use **inline** styles, NOT className: `welcome.tsx` "Get started" =
  `backgroundColor: tentzu.primary` (`#006a6a`); same for `TentzuButton`, `TentzuScreen` (sticky
  action bar), `TentzuOption`, `TentzuProgress`. Inline solid `backgroundColor` on a `Pressable`
  **always paints on native** — there is no RN path where it silently drops. So the current code
  *should* show teal buttons on a fresh build.
- `tentzu.primary` in `src/theme/tokens.ts` = `#006a6a` (valid). Not undefined.
- NativeWind IS correctly wired (babel `nativewind/babel` + preset jsxImportSource, metro
  `withNativeWind` input `./src/global.css`, `import '@/global.css'` in `src/app/_layout.tsx`,
  tailwind content `./src/**/*.{js,jsx,ts,tsx}`). So the className-based backgrounds on the
  `(auth)`/`(tabs)` screens (`bg-paper`, `bg-brand`, `bg-mist`, `bg-wash`) should also render.

**Leading hypothesis:** the user's iPhone has a **STALE standalone build** made BEFORE the
inline-style rebuild (commit `e6ff51a`), when buttons likely used a NativeWind className that a
release build didn't compile → transparent pill + white text = exactly this symptom on every page.
The fix would then be a **rebuild** (fresh iOS build; the Android APK at `c03a435` already has the
inline styles). **NOT YET CONFIRMED** — must see the current code render on a device/sim first.

**Verification attempt (incomplete):** launched the app in the **iOS Simulator** (iPhone 17 Pro,
Expo Go, SDK 56) via `npx expo start --ios` (Metro on port **8081**, log `/tmp/expo-ios3.log`).
Blocked by the Expo Go **dev-menu intro sheet** covering the screen on every launch — couldn't
dismiss it: no `idb`/`cliclick` initially, AppleScript blocked (no accessibility grant),
`screencapture` blocked (no screen-recording grant), `cliclick` installed but its synthetic click
isn't delivered (Terminal lacks Accessibility permission). Behind the sheet the Welcome bg + title
render on a LIGHT background, but the button is hidden by the sheet — **teal button not yet observed.**

**NEXT STEPS (do these to resolve):**
1. **Get a clean render of Welcome.** Best: `cd ark-mobile && npx expo run:ios` — builds the REAL
   native app (no Expo Go dev-menu overlay; boots straight to Welcome; simulator build skips code
   signing + push entitlement). `ios/` prebuild likely already exists. Then
   `xcrun simctl io booted screenshot ark-mobile/screenshots/sim-welcome.png` and LOOK at it.
   (Alt: grant Terminal Accessibility in System Settings → Privacy, then `cliclick` the dev-menu
   "Continue" — but `run:ios` avoids the dev menu entirely and is a more faithful repro.)
2. **If the teal button SHOWS in current code** → user's device is a stale build. Rebuild iOS
   (and reconfirm the Android APK). Tell the user to reinstall. Done — no code changes needed.
3. **If the teal button is MISSING in current code** → real bug. Inspect: is `TentzuBackground`'s
   final white scrim (`<Rect ... fill="#ffffff" opacity=0.36>`) or the whole SVG painting OVER
   content on native? (It's `pointerEvents="none"` + first-in-tree, so it shouldn't — but verify
   paint order on native.) Check font load (labels are inline-styled with `tentzuFont.*`). Then
   audit EVERY screen's primary/nav button and convert any fragile className backgrounds to inline
   token styles.
4. **Regardless:** the user wants ALL pages audited for nav-button/green-fill visibility. Screens to
   check: `(onboarding)/{welcome,home,pattern,rent,due-date,reminders,plan,save,verify-email,celebrate}`,
   `(auth)/{sign-in,email,register,forgot-password}`, `(tabs)/{index,documents,notifications,settings}`.

**Background processes left running (kill on cleanup):** an Expo dev server (nohup, port 8081) and
a booted iPhone 17 Pro simulator. Screenshots live in `ark-mobile/screenshots/`.

---

## ✅ CURRENT STATUS (2026-08-05) — deployed & shipped for team testing

Both launch tasks are **DONE and verified**. Nothing is blocking.
- **Backend:** Live at `https://tentzu-api.onrender.com` — `/api/v1/docs/` = 200, register = 201 with JWT + `dev_code`.
- **Android APK:** Built, link below, points at the live backend, no rebuild needed. Team can install now.
- **iOS:** No TestFlight/standalone build shipped this round (mac-only + needs Apple account — see "Next up").

### Next up (nothing is in flight — pick with the user)
1. **Collect team feedback** on the APK; triage into fixes.
2. **Before real (non-team) users:** set `EXPOSE_OTP_CODES=false` in Render → `tentzu-api` → Environment,
   and add a real `SENDGRID_API_KEY` so verify/reset codes go by email instead of the API response.
3. **iOS distribution** — needs an Apple account for TestFlight (or the free-team standalone recipe, mac-only).
4. **Backend follow-ups** (all disclosed in-app, non-blocking): `/push/register/` + Expo push dispatch,
   real Stripe price IDs + `/billing/portal/`, reminder task consulting `Subscription.tier`. See MOBILE.md table.
5. **Render free-tier caveats:** cold-starts ~30–50s after idle; free Postgres expires ~30 days after creation.

---

## Reference — how the two launch tasks were done

### 1. Deploy the backend on Render — ✅ DONE (2026-08-05)
Live and verified at **`https://tentzu-api.onrender.com`** — `/api/v1/docs/` returns 200,
register returns 201 with a JWT + `dev_code` (OTP exposure working). URL matches the APK's baked
value, so the APK needs no rebuild. (Reference: original deploy steps below.)
`render.yaml` is at the repo root. Steps (browser, user does it):
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

### 2. Android APK build — ✅ FINISHED
- **Download (installable APK):** https://expo.dev/artifacts/eas/Y6bkNM_T2Lv-yuDbNQja4IJJabztYjXCzcaqKDIquNo.apk
- ⚠️ This APK bakes in `https://tentzu-api.onrender.com/api/v1`. It only works once the Render
  backend (task 1) is Live at that exact URL. If Render assigns a different URL, rebuild (below).
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
