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

export const radius = {
  card: 20,
  pill: 999,
} as const;

export const spacing = {
  screen: 20,
  gap: 12,
} as const;
