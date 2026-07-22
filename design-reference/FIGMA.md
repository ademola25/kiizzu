# Design Reference — Cal AI

The mobile app (`ark-mobile/`) is intentionally built to mirror this Figma
design. Colors, layout, components, and even the placeholder copy are taken
from here; the cheque-reminder content will replace the calorie-tracking
content over time.

## Figma source
https://www.figma.com/design/R4ObTxbALQtfBqK8nzNzIF/Cal-AI-Deep-Dive?node-id=2-8

## Screenshots
Drop your Figma exports in `./screenshots/`. The originals from the first
session lived in macOS `/T/TemporaryItems/` and have since been purged by
the OS, so they're no longer reproducible from the filesystem — re-export
them whenever convenient.

Suggested set (these were the ones referenced when planning):

1. Onboarding script overview (notes panel)
2. Onboarding screen grid (gender / workouts / source / goals etc.)
3. Camera NUX flow (capture, ingredients, barcode)
4. Pricing + dashboard wireframes
5. "Create an account" + dashboard (2161 hero + quick menu)
6. Streak screen (🔥 0-day streak)

## Design tokens captured from these screens
See `ark-mobile/src/theme/tokens.ts` and `ark-mobile/tailwind.config.js`.

| Token | Value |
|---|---|
| Background | `#FFFFFF` paper / `#F5F5F5` mist |
| Text / primary | `#000000` ink |
| Border / hairline | `#EAEAEA` line |
| Secondary text | `#8A8A8E` muted |
| Accent (streak / urgency) | `#FF6B35` flame |
| Card radius | 20 px |
| Buttons | full-width black pill, white label |
| Font | Inter / SF Pro |
