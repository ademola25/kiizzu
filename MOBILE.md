# `ark-mobile/` — full state snapshot

A reference for picking up where Phases 0–8 left off. Treat this as the
"current truth" alongside the **end goal** in [`CLAUDE.md`](./CLAUDE.md), the
**design source** in [`design-reference/FIGMA.md`](./design-reference/FIGMA.md),
and the **operational guide** in [`ark-mobile/BUILD.md`](./ark-mobile/BUILD.md).

## What it is, in one paragraph

A Dubai tenant cheque-reminder mobile app. React Native + TypeScript via Expo,
designed to mirror the Cal AI aesthetic (monochrome + flame accent, native iOS
look on both platforms). Consumes the existing Django REST API in
`ark-backend/`. iOS and Android are equal first-class targets — every phase
is verified by both bundles compiling cleanly.

## Stack (verified versions in `ark-mobile/package.json`)

| Layer | Choice | Version |
|---|---|---|
| Runtime | Expo SDK | `~56.0.5` |
| React Native | core | `0.85.3` |
| React | UI | `19.2.3` |
| Language | TypeScript | strict mode on |
| Routing | `expo-router` | `~56.2.7`, typed routes disabled while routes settle |
| Styling | NativeWind (Tailwind) | `^4.2.4` / `^3.4.19` |
| Data | TanStack Query | `^5.100.14` |
| Auth state | Zustand | `^5.0.13` |
| HTTP | Axios | `^1.16.1`, JWT-aware with auto-refresh |
| Storage | `expo-secure-store` native, `localStorage` web | platform-aware shim in `src/lib/api.ts` |
| Files | `expo-document-picker` + `expo-file-system` | for S3 presigned uploads |
| Push | `expo-notifications` | `~56.0.15` — local machinery only, see gaps |
| Billing | `expo-web-browser` `openAuthSessionAsync` | for Stripe hosted checkout |
| Deep links | `expo-linking` | scheme `arkmobile://` |
| Icons | `@expo/vector-icons` (Ionicons) | `^15.0.2` |

## Project layout

```
ark-mobile/
├── app.json                        # plugins: expo-router, expo-splash-screen,
│                                   #          expo-secure-store, expo-notifications
├── eas.json                        # development / preview / production profiles
├── BUILD.md                        # operational guide — eas init, build, submit
├── tailwind.config.js              # Cal AI tokens
├── babel.config.js                 # nativewind/babel preset
├── metro.config.js                 # withNativeWind
├── nativewind-env.d.ts             # CSS module ambient + nativewind/types
└── src/
    ├── app/                        # expo-router routes
    │   ├── _layout.tsx             # providers + initPushNotifications() + Stack
    │   ├── index.tsx               # entry gate — routes by auth + onboarding state
    │   ├── billing-return.tsx      # Stripe deep-link safety net
    │   ├── (auth)/                 # sign-in / email login / register
    │   ├── (onboarding)/           # 6-step survey + celebrate
    │   └── (tabs)/                 # Home, Documents, Notifications, Settings
    ├── api/                        # TanStack Query hooks, one file per resource
    ├── components/
    │   ├── ui/                     # shared primitives
    │   ├── billing/                # PlanCard, UpgradeSheet
    │   ├── dashboard/              # CountdownHero, PaymentCard
    │   ├── documents/              # DocumentRow, UploadSheet
    │   ├── notifications/          # ReminderRow
    │   └── settings/               # EditProfileSheet, DeleteAccountSheet, PushCard
    ├── lib/                        # api, errors, format, notifications, types, etc.
    ├── store/                      # zustand: auth, onboarding draft
    └── theme/                      # design tokens (mirrors tailwind config)
```

## Feature inventory (by build-plan phase)

| Phase | Story / scope | Status | Honest gaps |
|---|---|---|---|
| **P0** Scaffold | Expo + NativeWind + Query + Zustand + axios + design tokens + base UI kit | ✅ | — |
| **P1** Auth | Apple/Google placeholder buttons + email register/login wired to `/auth/register/`, `/auth/login/`, `/auth/me/`, `/auth/refresh/`, `/auth/logout/`; route gating | ✅ email path; ❌ Apple/Google show "Coming soon" alert | Backend `/auth/social/` endpoint + provider OAuth client IDs |
| **P2** Onboarding | 6-step Cal-AI survey (building → address → pattern → start-date → rent → review) + celebrate; POSTs `/leases/create/`; flips `onboarding_complete` | ✅ | Date input is YYYY-MM-DD text — native calendar deferred |
| **P3** Dashboard | `CountdownHero` (overdue / today / 1–7d urgent / >7d calm), payment list with `StatusBadge`, mark-funds-ready, cleared/remaining stats, pull-to-refresh | ✅ | Lease edit deferred (Story 3.2) |
| **P4** Notifications | `GET /reminders/` history grouped by day, channel icons, reminder-type pills, status, timestamps | ⚠️ AC: "cheque referenced" MISSING — backend serializer doesn't expose `payment_schedule.cheque_number` (see backend gaps) | Backend: extend `ReminderLogSerializer` |
| **P5** Documents | Tab #2; list / upload (presigned PUT via `UploadTask`) / view (`openBrowserAsync` with `showInRecents:false`) / delete; PDF/JPG/PNG ≤ 10 MB; soft-delete; orphan cleanup on PUT failure | ✅ | — |
| **P6** Settings | Profile edit (name + phone), WhatsApp opt-in toggle (real backend field), lease summary (read-only), logout, type-DELETE-to-confirm account deletion | ✅ | Email change not supported by backend; per-window timing toggles not backed by backend |
| **P7** Billing | `PlanCard` shows tier; free users get `UpgradeSheet` → Stripe hosted checkout via `openAuthSessionAsync`; WhatsApp toggle gated by tier (UI-only); `/billing-return` deep-link fallback | ⚠️ Backend has placeholder Stripe price IDs → every checkout returns 502 in dev; "Manage subscription" intentionally not shipped (no backend portal endpoint) | Real price IDs; `/billing/portal/` endpoint; reminder task should consult tier (Story 4.4) |
| **P8** Push + ship prep | `initPushNotifications()` at app start (foreground handler + Android channel HIGH); `PushCard` with five honest states, `AppState` re-check; `StateCard` primitive used across all four tabs; inline-error migration to `errors.ts`; `eas.json` + `BUILD.md` | ⚠️ Token captured but not synced anywhere (no backend `/push/register/`); backend reminder task doesn't dispatch Expo push — disclosure in `PushCard` copy is honest about this | Backend `/push/register/` + Expo push dispatch in Celery task |

## Route map

```
(root) /                        index.tsx       auth+onboarding gate → redirect
(auth) /(auth)/welcome          welcome.tsx     Kizu landing (first screen, signedOut) → "Get Started"
       /(auth)/sign-in          sign-in.tsx     Apple/Google placeholder + "Continue with email"
       /(auth)/email            email.tsx       email login
       /(auth)/register         register.tsx    full register form
(onbd) /(onboarding)            index.tsx       redirect to /building
       /(onboarding)/building   step 1/6
       /(onboarding)/address    step 2/6
       /(onboarding)/pattern    step 3/6 (cheque pattern OptionCards)
       /(onboarding)/start-date step 4/6
       /(onboarding)/rent       step 5/6
       /(onboarding)/review     step 6/6 → POST /leases/
       /(onboarding)/celebrate  success → /(tabs)
(tabs) /(tabs)/index            Home — CountdownHero, payment list, mark-funds-ready
       /(tabs)/documents        Documents — upload/view/delete via S3 presigned
       /(tabs)/notifications    Notifications — reminder history grouped by day
       /(tabs)/settings         Settings — account, plan, push, reminders, lease, logout, delete
(deep) /billing-return          billing-return.tsx  Stripe checkout safety-net landing
```

The entry gate at `src/app/index.tsx` resolves on every cold start:

- `status === 'loading'` → spinner
- `signedOut` → `/(auth)/sign-in`
- `signedIn` && `!user.onboarding_complete` → `/(onboarding)`
- `signedIn` && `onboarding_complete` → `/(tabs)`

`(tabs)/_layout.tsx` repeats the same guard so a deep link can't skip onboarding.

## Design system

Mirrors Cal AI — see [`design-reference/FIGMA.md`](./design-reference/FIGMA.md) for the Figma source and screenshot folder.

| Token | Value | Tailwind class |
|---|---|---|
| `ink` (text / buttons) | `#000000` | `text-ink`, `bg-ink` |
| `paper` (cards) | `#FFFFFF` | `bg-paper` |
| `mist` (page bg) | `#F5F5F5` | `bg-mist` |
| `line` (hairlines) | `#EAEAEA` | `border-line` |
| `muted` (secondary text) | `#8A8A8E` | `text-muted` |
| `flame` (urgency / streak) | `#FF6B35` | `text-flame`, `border-flame` |
| Card radius | 20 px | `rounded-card` |
| Pill button | full radius | `rounded-pill` |
| Font | Inter / system | `font-sans` |

Shared in `src/theme/tokens.ts` for places that can't use className (tab bar tints, status bar, icons).

**Shared primitives (`src/components/ui/`)**: `Card`, `PillButton`, `ScreenHeader`, `Input`, `StatusBadge`, `ProgressBar`, `OptionCard`, `Step` (onboarding wrapper), `BottomSheet`, `ToggleRow`, `StateCard` (loading/error/empty triad).

## State management

### Auth — `src/store/auth.ts` (Zustand)

```ts
type AuthState = {
  user: User | null;
  status: 'loading' | 'signedIn' | 'signedOut';
  bootstrap: () => Promise<void>;       // run once at root layout mount
  login: (email, password) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  refreshUser: () => Promise<void>;     // re-fetch /auth/me/
  updateProfile: (patch) => Promise<void>;  // PATCH /auth/me/ (not PUT)
  deleteAccount: () => Promise<void>;   // DELETE + tokenStore.clear + queryClient.clear
  logout: () => Promise<void>;          // tokenStore.clear + queryClient.clear
};
```

Both `logout` and `deleteAccount` call `queryClient.clear()` — caches don't leak between accounts on a shared device.

### Onboarding draft — `src/store/onboarding.ts`

In-flight survey state, cleared on celebrate. Fields match the `POST /leases/` payload one-to-one.

### Server state — TanStack Query

| Hook | File | Endpoint |
|---|---|---|
| `usePayments`, `useMarkReady` | `src/api/payments.ts` | `/payment-schedules/` |
| `useLease` | `src/api/leases.ts` | `GET /leases/` → first lease or `null` (note: lease **create** is a separate route — `POST /leases/create/`, called inline from onboarding `review.tsx`; `POST /leases/` is GET-only and returns 405) |
| `useReminders` | `src/api/reminders.ts` | `/reminders/` |
| `useDocuments`, `useUploadDocument`, `useDeleteDocument`, `fetchDownloadUrl` | `src/api/documents.ts` | `/documents/*` |
| `useSubscription`, `useCreateCheckout`, `useInvalidateSubscription` | `src/api/billing.ts` | `/billing/*` |
| `unwrapList<T>` | `src/api/_paginated.ts` | shared helper for bare-array OR `{results}` |

All hooks rely on the JWT-aware axios client in `src/lib/api.ts` (access token in memory + secure storage; refresh on 401; platform-aware storage).

## Honest backend dependencies (open follow-ups)

These are mobile-blocking only at the level of "can't close the AC loop end-to-end"; the mobile UI shipped with honest disclosure for each.

| # | Gap | What unblocks |
|---|---|---|
| 1 | `ReminderLogSerializer` doesn't expose `payment_schedule.cheque_number` / `due_date` | Phase 4 "cheque referenced" AC; `ReminderRow` has a TODO and the third line ready to wire |
| 2 | Stripe price IDs are literal placeholders in `views.py` | Phase 7 checkout returns 502 until real Stripe price IDs are configured; the 502 message says "Our payments provider rejected the request — likely a configuration gap on our side" so it's not blamed on the user |
| 3 | No `/billing/portal/` Stripe customer-portal endpoint | Phase 7 ships no in-app cancel; UpgradeSheet copy says "Cancel by replying to your Stripe receipt email" |
| 4 | Reminder task doesn't consult `Subscription.tier` (Story 4.4) | Phase 7 WhatsApp gating is UI-only — disclosed quietly (no callout copy) per user decision |
| 5 | No `/push/register/` endpoint | Phase 8 captures the Expo push token but holds it locally; PushCard says "We'll send a banner the moment push delivery is wired on the server side" |
| 6 | Reminder task doesn't dispatch Expo push alongside WhatsApp + email | Same — PushCard copy already accounts for this |
| 7 | Stripe checkout `success_url` must be HTTPS in production | `arkmobile://billing-return` will fail Stripe's URL validator on real Stripe keys; standard fix is a backend HTTPS bounce page `GET /billing/return/?status=…` → 302 to the mobile scheme |
| 8 | `views.py:83` docstring drift on `DeleteAccountView` | Cosmetic — docstring says `DELETE /api/v1/auth/me/` but route is `/auth/me/delete/`; mobile follows the route, backend ticket only |
| 9 | `DeleteAccountView` doesn't blacklist refresh tokens | Mobile clears local SecureStore; in-flight refresh tokens stay valid until expiry |

## How to add a new feature (pattern reference)

1. **Backend audit first** — read the relevant `serializers.py` / `views.py` / `urls.py` under `ark-backend/ark/<app>/`. Capture the actual response shape and write the type in `src/lib/types.ts` to match.
2. **API hook** — new file under `src/api/`. Use `unwrapList` from `_paginated.ts` so the hook survives a future DRF pagination flip.
3. **Domain components** — under `src/components/<area>/`. Reuse `Card`, `PillButton`, etc. — don't invent a new primitive unless the third instance shows up.
4. **Route** — file under `src/app/`. If it's authenticated, put it under `(tabs)/` (visible nav) or under a new route group with its own auth gate. If it's a sheet, use `BottomSheet`.
5. **Errors** — wrap any `try/catch` payload through `errorMessage(err, fallback)` from `src/lib/errors.ts`. It already flattens DRF field-error dicts.
6. **Disclosure first** — if the backend can't yet back the full feature, write the user-facing copy honestly *up front*. Past phases proved this is where the PM agent will catch us if we don't.
7. **Verify both bundles** — `npx tsc --noEmit && npx expo export --platform ios && npx expo export --platform android`. Per `CLAUDE.md`, both must pass at the end of every phase.
8. **Two-pass review** — for non-trivial work, fan out a cold-eyed code reviewer + a PM/regression agent in parallel. The pattern: build → spawn two `general-purpose` agents with the specific Phase-N scope → triage MUST / SHOULD / NICE / NOTES → apply MUSTs + cheap SHOULDs → re-verify.

## Running / shipping

| Want to … | Run |
|---|---|
| Boot the dev server | `cd ark-mobile && npx expo start`, then `i` (iOS sim), `a` (Android emulator), `w` (web), or scan QR with Expo Go |
| Boot in browser only | `npx expo start --web` → Chrome DevTools device mode for phone viewport |
| Bundle iOS | `npx expo export --platform ios --output-dir /tmp/x` |
| Bundle Android | `npx expo export --platform android --output-dir /tmp/y` |
| Build for TestFlight / Play | See [`BUILD.md`](./ark-mobile/BUILD.md) |
| Test push without backend | See "Testing push without the backend" section in `BUILD.md` |

## Where each thing lives (quick map)

| If you need to change … | Look at |
|---|---|
| Color tokens | `src/theme/tokens.ts` + `tailwind.config.js` (both must agree) |
| API base URL | `EXPO_PUBLIC_API_URL` env (defaults to `localhost:8000/api/v1`) |
| Auth lifecycle | `src/store/auth.ts` |
| Routing rules | `src/app/index.tsx` (top gate) + `src/app/(tabs)/_layout.tsx` (tabs gate) |
| Tab bar contents | `src/app/(tabs)/_layout.tsx` |
| Push handler / Android channel | `src/lib/notifications.ts` (`initPushNotifications`) |
| Stripe redirect handling | `src/api/billing.ts` (`useCreateCheckout`) + `src/components/billing/UpgradeSheet.tsx` + `src/app/billing-return.tsx` |
| Cal AI mirror brief | `CLAUDE.md` + `design-reference/FIGMA.md` |
| EAS profiles | `eas.json` + `BUILD.md` |

## What's done vs what's next

**Done across Phases 0–8**: all eight build-plan phases shipped, every phase
verified by `tsc` clean + both iOS and Android bundles compiling, every
non-trivial phase passed through a fresh code-review + PM/regression pair of
agents. The mobile app is feature-complete against the planned scope —
remaining work is operational (`BUILD.md`) and backend-side (the table above).

**Not yet done**:

- Real TestFlight / Play upload (requires Apple/Google accounts + signing — see `BUILD.md`)
- The nine backend follow-ups in the table above
- Lease edit flow (Story 3.2 — deferred to its own phase)
- Three-card Free/Starter/Pro comparison view (Story 7.2 — deferred until backend customer portal exists)

This document is the source of truth for "where is mobile right now?" — keep
it updated as the picture changes.
