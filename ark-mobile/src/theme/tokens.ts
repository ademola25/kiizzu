// Design tokens — single source of truth for non-className usage
// (navigation tints, status bar, inline-styled screens).
//
// The app has two palettes living side by side:
//   • `colors` — the original Cal-AI monochrome, still used by the tab screens.
//   • `tentzu`   — the calm-turquoise brand (Material-3 teal) used by the whole
//                onboarding flow + welcome. Mirrors design-reference/tentzu/DESIGN.md.
export const colors = {
  ink: '#1a1c1e',
  paper: '#FFFFFF',
  mist: '#f0f5f5',
  line: '#dfe9e8',
  muted: '#6b7a79',
  brand: '#006a6a', // turquoise primary (inline use)
  wash: '#e8f6f6', // soft teal fill
  danger: '#ba1a1a', // errors / destructive
  amber: '#f0a52a', // due-soon / caution
  flame: '#FF6B35', // legacy accent — retained for any inline reference
} as const;

// Tentzu brand palette. The first block are the original keys (kept so `welcome`
// and anything already importing them stays valid); the rest extend the scale
// for the rebuilt onboarding flow.
export const tentzu = {
  // — original keys —
  primary: '#006a6a',
  primaryContainer: '#00d7d7',
  secondary: '#50606f',
  bg: '#f9f9fc',
  ink: '#1a1c1e',
  inkVariant: '#3b4949',
  outline: '#bacac9',

  // — extended —
  primaryDeep: '#00504f', // pressed / darker teal
  primaryBright: '#00b8bb', // mid accent
  primaryGlow: '#00d7d7', // bright cyan glow
  primaryFixed: '#50f9f9', // lightest brand cyan
  onPrimaryContainer: '#005959',
  // Liquid-glass CTA ramp: cyan -> brand blue, matching the reference flow.
  // A flat fill reads as a 2019 button next to frosted surfaces; the ramp plus a
  // coloured glow is what makes the pill feel lit rather than painted.
  ctaGradient: ['#2fd0e0', '#0e9ec4', '#0b7fb0'] as const,
  glassStroke: 'rgba(255,255,255,0.65)',
  glassFill: 'rgba(255,255,255,0.55)',
  tintSurface: '#e8f6f6', // soft teal wash (selected states, illustration panels)
  tintSurfaceDeep: '#d5efef',
  secondaryContainer: '#d1e1f4',
  card: '#ffffff',
  field: '#ffffff',
  fieldBorder: '#cfe0df',
  track: '#e1eceb', // progress track
  mutedInk: '#6b7a79', // secondary text / placeholders
  danger: '#ba1a1a',
  dangerBg: '#ffe9e6',
  amber: '#f0a52a', // sparing warm accent
  white: '#ffffff',
} as const;

// Only weights actually loaded in src/app/_layout.tsx are referenced here.
export const tentzuFont = {
  headline: 'PlusJakartaSans_800ExtraBold',
  headlineBold: 'PlusJakartaSans_700Bold',
  headlineItalic: 'PlusJakartaSans_700Bold_Italic',
  body: 'BeVietnamPro_400Regular',
  label: 'BeVietnamPro_600SemiBold',
} as const;

// Type scale. Sizes were previously hardcoded at 99 call sites across 30 files
// with 21 distinct values — 13 and 13.5 and 14 all in use, which is what QA saw
// as inconsistent hierarchy rather than any single element being wrong. New
// work should reference these; existing screens are being migrated as they are
// touched.
// Every size the app uses has a name here, and nothing outside this set is
// allowed. tailwind.config.js reads the same values, so the inline-style and
// className paths cannot drift apart — which is how 13, 13.5 and 14 all ended
// up in use at once.
export const fontSize = {
  /** Dashboard countdown — the one number the whole app exists to show. */
  hero: 42,
  jumbo: 36,
  /** Onboarding headline. */
  display: 30,
  /** Tab screen titles. */
  title: 24,
  section: 20,
  lead: 18,
  subtitle: 16,
  body: 15,
  label: 14,
  caption: 13,
  /** Smallest size still comfortable to read — badges, meta rows. */
  fine: 12,
  micro: 11,
} as const;

export const radius = {
  card: 20,
  pill: 999,
} as const;

export const spacing = {
  screen: 20,
  gap: 12,
} as const;
