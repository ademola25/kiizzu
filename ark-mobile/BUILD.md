# Building & shipping ark-mobile

This is the operational guide for taking the app from `npx expo start`
on a laptop to TestFlight / Play Store. Everything here is run from the
`ark-mobile/` directory.

## One-time setup

```bash
npm i -g eas-cli           # if not already installed
eas login                  # uses your Expo account
eas init --id <project-id> # creates the EAS project; writes app.json extra.eas.projectId
```

After `eas init`, `Constants.expoConfig.extra.eas.projectId` is what
`src/lib/notifications.ts` reads when fetching the Expo push token. Push
won't work in builds that don't have this set.

## Build profiles (`eas.json`)

| Profile | Purpose | Output | Distribution |
|---|---|---|---|
| `development` | Custom dev client for daily local work (Hot reload, devtools) | iOS Simulator + Android APK | Internal (Expo links) |
| `preview` | Internal QA / beta builds before submission | iOS device-installable + Android APK | Internal |
| `production` | Store submission | iOS IPA + Android AAB | Store |

## Common commands

> Prerequisite for *any* `eas build`: `eas init --id <project-id>` must have
> run once so `app.json` carries `extra.eas.projectId`. Push notifications
> won't fetch a token without it, and `appVersionSource: remote` won't
> resolve either.

```bash
# Dev client (recommended over Expo Go once we have native modules)
eas build --profile development --platform ios
eas build --profile development --platform android

# Internal QA build
eas build --profile preview --platform all

# Store-ready build
eas build --profile production --platform all

# Submit a finished production build.
# Prereq: Apple Developer + Google Play accounts already linked via
# `eas credentials` — see "What you need before the first production build".
eas submit --platform ios
eas submit --platform android
```

## Testing push without the backend

The mobile machinery (`src/lib/notifications.ts` + `PushCard`) can be
verified end-to-end without waiting for the backend endpoint:

1. Build a dev client (`eas build --profile development`) and install it.
2. Open Settings → tap **Enable push notifications**. PushCard will flip
   to "Permission granted" once a token is fetched.
3. Grab the Expo push token: in dev, log `result.token` from the
   `registerForPushNotifications` mutation, or run a `console.log` patch.
4. Paste the token at <https://expo.dev/notifications>, fill in a title
   and body, and send. The device should show a banner.

This confirms the OS-side wiring works before the backend `/push/register/`
endpoint and the Celery Expo-push dispatcher land.

## What you need before the first production build

- **Apple Developer Program** account ($99/year). EAS will walk you
  through provisioning the certificate + push key the first time.
- **Google Play Console** developer account ($25 one-time). EAS will
  generate the upload keystore.
- **APNs key** — created once in App Store Connect and uploaded via
  `eas credentials`. Required for real iOS push delivery.
- **FCM service account JSON** — uploaded via `eas credentials` (or
  uploaded to Expo Push). Required for real Android push delivery.

## Apple in-app-purchase caveat (Phase 7 billing)

Phase 7 ships Stripe-hosted checkout for the Starter upgrade. Apple's
App Store guidelines technically require digital subscriptions to use
**Apple In-App Purchase**, and the App Store reviewer may push back on
that flow during submission. TestFlight builds are generally fine. If
the App Store reviewer rejects:

1. Short-term: gate the Upgrade CTA off on iOS production builds via a
   Stripe-flag-or-platform check and direct users to the web app.
2. Long-term: add Apple IAP via `expo-iap` (or React Native's StoreKit
   wrapper) on iOS while keeping Stripe on Android.

This is a Phase-N+ decision — don't pre-emptively split the flow.

## Sanity checks before pushing a build

```bash
npx tsc --noEmit                              # types clean
npx expo export --platform ios --output-dir /tmp/x   # iOS bundles
npx expo export --platform android --output-dir /tmp/y  # Android bundles
```

If either bundle fails, the EAS build will fail too — fix locally first.

## Backend follow-ups before Phase-8 push goes live end-to-end

- **`POST /push/register/` endpoint** on the backend that accepts
  `{ token, platform }` and writes a `PushDevice` row keyed to the user.
  Without it, `src/lib/notifications.ts` captures the token but has
  nowhere to send it — the Settings card discloses this honestly.
- Backend reminder task in `ark/reminders/tasks.py` should also dispatch
  Expo push (`expo-server-sdk-python` or HTTP) alongside WhatsApp and
  email, gated on whether the device has registered a token.
