# HANDOFF — Tentzu

**Last updated:** 2026-08-10 (macOS session). Read this first, then `MOBILE.md` and `CLAUDE.md`.
Single source of truth for "what is in flight right now". Local `~/.claude` memory does not
travel between machines, so everything needed is here.

---

## State at a glance

| | |
|---|---|
| Repo | `ademola25/kiizzu`, branch `main`. HEAD = **`eb6b285`**, tree clean, all pushed. |
| Backend | Live at `https://tentzu-api.onrender.com`, deployed **`4d0c12c`** |
| Latest APK | https://expo.dev/artifacts/eas/_foPLO1GqXA_1HsqqBcwvZu-OIk_R8Oonn0Qb8rrJ8I.apk (from `eb6b285`) |
| iOS | Installed on DonJohn but **stale** — nothing since `7906260` is on it, and free signing expired ~13 Aug |
| Tests | 74 backend, `tsc` clean, both bundles export |

**Deployed is 2 commits behind HEAD and that is fine** — `d8bca0e` and `eb6b285` are mobile-only
(keyboard/logout/unit, and the glass redesign). No backend code changed in either. Verify with
`git log --oneline 4d0c12c..HEAD -- ark-backend/` (should be empty).

---

## 🔑 THE ONE THING BLOCKING REAL EMAIL

Codes still only appear on-screen. To send real email, set **`RESEND_API_KEY`** in
Render → `tentzu-api` → Environment, plus `DEFAULT_FROM_EMAIL` on a verified domain.

- **Do NOT try SMTP.** Outbound SMTP is blocked on Render — measured from inside the container:
  `smtp.gmail.com:587/465/25` → *Network is unreachable*, `smtp.resend.com:587` → timeout, while
  `api.resend.com:443` and `api.sendgrid.com:443` connect in 0.01s. A Gmail app password cannot
  work there whatever the credentials. This is recorded in `config/settings/production.py`.
- **SendGrid's free plan was retired in 2025** (60-day trial, then $19.95/mo). Resend has a
  standing free tier: 3,000/month, 100/day, one verified domain.
- The Resend code path already exists (`ark/users/emails.py`, stdlib `urllib`, 10s timeout).
- `tentzu.com` is yours on GoDaddy. Use a **subdomain** (`send.tentzu.com`) for Resend's DNS —
  the root already has a GoDaddy SPF record and **a domain may only have one SPF record**;
  adding a second silently breaks both.
- GoDaddy appends the domain automatically: enter `send`, not `send.tentzu.com`.
- Once real mail works, set `EXPOSE_OTP_CODES=false`. The on-screen code card then disappears by
  itself — **no app rebuild needed**, it only renders when the server sends a code.

---

## ⏳ HARD DEADLINE: database expires 2026-09-04

Render's free Postgres has a 30-day life from creation (2026-08-05). At expiry **the database is
deleted, along with every account and lease** — it is not a downgrade. Before then, either
upgrade the instance or dump and restore onto a fresh one. Tell testers before they invest time
creating data.

---

## What this app is now

Tentzu was Dubai-only. It is not any more, and most of the recent work was making that true
rather than aspirational.

### Worldwide (`6a49b89`)
- **Phone**: E.164 shape only (`+`, non-zero country code, 8–15 digits). Per-country digit rules
  are deliberately NOT enforced — they vary by carrier and change, and a wrong rule locks real
  users out. Entry is a dial-code picker + local number, composed in `lib/phone.ts`; it tolerates
  a re-typed country code and strips national trunk zeros (UK/TR/AU).
- **Money**: `Lease.currency` (ISO 4217), per-lease not per-user — one person can rent in two
  countries. `formatMoney` falls back to `"<CODE> <amount>"` if the runtime lacks Intl data for
  the currency; Hermes ships a trimmed ICU on some Android builds and a RangeError there would
  blank the dashboard hero.
- **Timezone**: `User.timezone` (IANA, from the device). Reminder windows are computed in each
  tenant's own local day — a 30/7/1-day window measured in Asia/Dubai lands a day out across the
  Americas, so "1 day away" would arrive after the cheque was due.
- Existing rows default to `AE`/`AED`, so original Dubai data is untouched.

### Monthly rent (`6a49b89`)
Pattern `12` added. Every pattern must divide 12 — the engine spaces cheques `12 // pattern`
months apart, so a non-divisor silently drifts. Serializers derive the accepted set from
`schedule_engine.ChequePattern` instead of the three hardcoded lists that used to exist.

### Country-driven address form (`4d0c12c`)
Country is the first field and drives everything below it.

- **Offline data** in `lib/addressFormats.ts`: subdivision list + label, postcode
  presence/label/example, city wording, street placeholder, per-country unit rules, bbox.
  The form is fully usable with no network.
- **Why per-country**: ~40 countries have no postal code at all, the **UAE included** — asking a
  Dubai tenant for one asks for something that does not exist. Where it exists the name changes:
  ZIP code, Eircode, PIN code, PLZ, CEP, CAP. Same one level up: State, Province, Emirate,
  County, Region.
- **Network is progressive enhancement only** (`lib/addressLookup.ts`), all keyless:
  Photon (worldwide street type-ahead, bbox-constrained then re-filtered on countrycode),
  postcodes.io (UK partial-postcode autocomplete + postcode→town), Zippopotam (postcode→city/state,
  ~60 countries). Debounced 350ms, 3-char minimum, 6s timeout, **fails silently**. Photon's terms
  say "extensive usage will be throttled" with no availability guarantee — hence the rule that
  autocomplete is an accelerator, never a gate.
- Upgrade path when volume grows: swap two functions for Geoapify (3k/day free, keyed) or Google
  Places. Nothing else changes.
- **Not possible free**: "dropdown of every address in a postcode" needs Royal Mail PAF
  (licensed) in the UK and equivalents elsewhere. Type-ahead is the substitute.

### Keyboard / logout / unit (`d8bca0e`)
- **Keyboard covered inputs everywhere.** Root cause is a platform change, not our layout: from
  **Android 15 (API 35)** the window no longer resizes for `adjustResize`, and Expo enables
  edge-to-edge by default from SDK 53. Together those make RN's `KeyboardAvoidingView` a no-op on
  Android — ours passed `behavior={undefined}` there. Now `react-native-keyboard-controller`
  (`KeyboardAwareScrollView` in `TentzuScreen`, both auth screens, and its `KeyboardAvoidingView`
  in `BottomSheet`).
- **Logout** cleared the session but the entry gate sends signed-out users into the onboarding
  survey, so it looked like nothing happened. Now routes to `/(auth)/email`. **More importantly**
  the survey draft is in-memory and outlived the session, so the next person saw the previous
  user's address and rent — `logout` and `deleteAccount` now `useOnboarding.reset()`.
- **Unit number** is per-country: optional GB/US/CA/AU/IE, required AE/HK/IN, locally worded.

### Liquid-glass UI (`eb6b285`)
- **Dubai skyline SVG deleted** — it dated the app and contradicted worldwide positioning.
- `assets/images/app-backdrop.jpg` (43 KB) is a heavily blurred derivative of the brand artwork.
  The source is a busy portrait carrying legible **"KIZU"** badge text (old branding); blur at
  r=100 + brighten + desaturate + brand wash turns it into ambient light and destroys the stale
  wordmark. One plate, mounted per navigation group so it never re-decodes between screens.
- **Glass = three layers**: BlurView, a white fill, a hairline light border. Applied to fields,
  option rows, dropdown triggers, `Card`, the sticky action bar and the tab bar.
- **Contrast never depends on the blur landing** — the white fill carries it. Android uses a
  higher fill and lower blur intensity because BlurView is expensive there.
- CTA is a cyan→blue ramp with a same-hue glow (`tentzu.ctaGradient`).

---

## Operational notes

### Render access
CLI installed and authenticated; token in `~/.render/cli.yaml`. The CLI needs an interactive
workspace pick, so use the REST API with the key from that file.
Service `tentzu-api` = `srv-d9pfhs710e5c73d9jvh0`, owner `tea-cv17o20gph6c73aqcmvg`,
Postgres `dpg-d9pffan10e5c73d9d7l0-a`.
- Deploy: `POST services/{id}/deploys {"clearCache":"do_not_clear"}`, poll until `live` (~1m20s)
- Env var: `PUT services/{id}/env-vars/{KEY}` (per-key; the bulk PUT replaces everything)
- Logs: `GET logs?ownerId=…&resource=…&limit=40`
- **Env var changes via API do not restart the service** — deploy after
- **`autoDeploy=yes` but pushes have not been triggering deploys** (likely the
  `rootDir: ark-backend` build filter). **Deploy manually after every backend push.**

### Checking an EAS build — read this before reporting status
`eas build:view` can report **`status: IN_PROGRESS` while `artifacts.applicationArchiveUrl` is
already populated**. In this session that caused a finished build to be reported as still running
for hours. **Check `artifacts` and `updatedAt`, not `status` alone.**

```bash
npx eas-cli build:view <id> --json | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["status"], d.get("updatedAt"), (d.get("artifacts") or {}).get("applicationArchiveUrl"))'
```

### iOS
`ios/` prebuild exists but **needs `pod install`** before it compiles again — `expo-blur`,
`expo-linear-gradient` and `react-native-keyboard-controller` were added since the last local
build. Free Personal-Team signing expires ~7 days; device UDID `F77FF8AB-FF3A-5485-85E1-CB10121416EC`,
team `8B748JDU2V`, entitlements must stay an empty dict (free teams cannot sign push).
Export `EXPO_PUBLIC_API_URL=https://tentzu-api.onrender.com/api/v1` or `.env` bakes a LAN IP.

### Release-only failure modes (bitten twice)
- **Function-form `style` props** (`style={({pressed}) => ({...})}`) are dropped wholesale in
  Release builds — background, padding and flexDirection together. Use plain objects.
- **`__DEV__` is false in Release** — never gate a user-facing affordance on it.
- Reproduce with `npx expo run:ios --configuration Release`. Debug proves nothing.
- Hermes stores any string containing a non-ASCII character as **UTF-16**, so plain `strings`
  cannot find it and its absence proves nothing. Search raw bytes for both encodings.

---

## Still open

1. **`RESEND_API_KEY`** — the only thing between you and real emails.
2. **Database expires 2026-09-04** — data loss, not a downgrade.
3. **`(auth)` / `(tabs)` screens have never been visually verified in a Release build.** Static
   audit found nothing, but static reasoning said the same about the onboarding buttons right up
   until Release proved otherwise. Tapping through on the phone closes this fastest.
4. **Android blur quality unverified on device.** Intensity is deliberately lower and white fill
   higher on Android; panes may read flatter than the `flow-tentzu` reference. Also unverified:
   scroll smoothness now that every `Card` is a blur surface — `Card` takes a `solid` prop if a
   list stutters.
5. **One backdrop plate for every screen** (as requested). The reference varies it per screen;
   per-group variants are a small change.
6. `EMAIL_HOST_USER` still set on Render and now inert. `STARTER_PRICE_LABEL` is still
   "AED 15 / month" — a pricing decision, not a bug.
7. Backend follow-ups unchanged: `/push/register/` + Expo push dispatch, real Stripe price IDs,
   `/billing/portal/`, reminder task consulting `Subscription.tier`. **No Celery worker is
   deployed**, so reminders do not currently run at all.

---

## Conventions (from CLAUDE.md — obey)
- Never add Claude as a git co-author.
- Commit/push only when asked.
- Verify both platforms bundle at the end of each phase.
