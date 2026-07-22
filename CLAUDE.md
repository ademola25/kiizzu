# Ark — Project Context & End Goal (loaded every session)

## 🎯 END GOAL (do not lose sight of this)
Pivot Ark from a **web app** to a **mobile app first** (web comes later). The mobile
app must **mirror the Cal AI Figma design exactly** — colors, layout, components, and
even the content/wording (placeholder copy now; the tenant-cheque content will replace
it later). The user explicitly likes this exact design and wants a faithful clone as the
starting point, then we adapt content + branding to the Dubai tenant cheque-reminder domain.

**Figma:** https://www.figma.com/design/R4ObTxbALQtfBqK8nzNzIF/Cal-AI-Deep-Dive?node-id=2-8
(Cal AI calorie-tracker design — to be mirrored for our tenant app.)

## What Ark is
A SaaS app reminding Dubai tenants when their next post-dated rent cheque is due, via
WhatsApp / email / SMS. Backend is a tested Django REST API; existing web frontend is React.

## Repo strategy (DECIDED)
- **Keep this repo.** Do NOT start fresh.
- `ark-backend/` — Django REST API. **Reuse as-is** (mobile-agnostic). Data model + schedule engine stay.
- `ark-mobile/` — **NEW** Expo React Native app. This is the active focus.
- `ark-frontend/` — existing React web app. **Frozen** for later.

## Tech stack (DECIDED)
- **Mobile:** Expo (React Native) + TypeScript, expo-router, NativeWind (Tailwind),
  TanStack Query, Zustand, axios. Push notifications via Expo.
- **Backend:** unchanged — Django 5.2 + DRF + SimpleJWT + Celery + Redis.
- **Database:** unchanged — PostgreSQL 16.

## Platform commitment (DECIDED)
The mobile app must ship **both iOS and Android** — they are equal first-class
targets, not "iOS first, Android later". Every new screen / native module must
compile and behave on both. Verification rule: `npx expo export --platform ios`
AND `--platform android` both succeed at the end of each phase. Apple Sign In
is iOS-only; on Android, only Google + email auth are offered (we never hide
this — the UI degrades visibly).

## Design language (mirror Cal AI)
Monochrome: white `#FFFFFF` / light-grey `#F5F5F5` background, black `#000000` text & buttons,
orange flame accent `#FF6B35` (streak). White rounded cards (~20px radius, soft shadow),
black pill buttons, Inter/SF Pro font, bottom tab bar + floating "+" action. Big-number
dashboard hero card. Multi-step one-question-per-screen onboarding survey. Streak screen.

## Build plan (scratch → finish)
- **P0 Scaffold:** Expo + TS + expo-router + NativeWind + Query/Zustand/axios; design tokens + base UI kit.
- **P1 Auth:** Apple/Google + email sign-in screens; wire to existing JWT endpoints (+1 social-auth endpoint backend-side).
- **P2 Onboarding:** Cal-AI multi-step survey → maps to lease setup (property, cheque pattern, rent, start date).
- **P3 Dashboard:** big-number hero = next cheque countdown; "recently logged" = payments; tabs + FAB; mark-funds-ready.
- **P4 Core:** payments schedule, documents (S3 presigned), notifications/reminder history, streak screen.
- **P5 Settings & billing:** profile, reminder prefs, plan/upgrade, account deletion.
- **P6 Polish & ship:** push notifications (device-token endpoint), empty/loading states, EAS build → TestFlight.

## Conventions
- Mirror the Figma faithfully first; content/branding swaps come after.
- Reuse the backend API — avoid duplicating business logic in the app.
- Never add Claude as a git co-author.

## Reference screenshots (from Figma, captured 2026-05-28)
Onboarding survey flow, Sign in with Apple/Google, dashboard (big "2161" card + recently
logged + bottom tabs + FAB), camera/scan NUX, streak screen, progress charts, settings.

See `./design-reference/FIGMA.md` for the Figma URL and design-token capture, and
`./design-reference/screenshots/` for the exported reference screenshots.

## Current state snapshot
`./MOBILE.md` is the source of truth for "where is the mobile app right now?" —
feature inventory by phase, route map, API surface, state stores, design tokens,
honest backend gaps, and a "where each thing lives" file map. Read it first when
picking up a new session.
