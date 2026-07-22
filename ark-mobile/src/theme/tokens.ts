// Cal AI design tokens — single source of truth for non-className usage
// (navigation tints, status bar, etc.). Mirrors tailwind.config.js.
export const colors = {
  ink: '#000000',
  paper: '#FFFFFF',
  mist: '#F5F5F5',
  line: '#EAEAEA',
  muted: '#8A8A8E',
  flame: '#FF6B35',
} as const;

// Kizu brand palette + fonts — mirrors tailwind.config.js `kizu` namespace.
export const kizu = {
  primary: '#006a6a',
  primaryContainer: '#00d7d7',
  secondary: '#50606f',
  bg: '#f9f9fc',
  ink: '#1a1c1e',
  inkVariant: '#3b4949',
  outline: '#bacac9',
} as const;

export const kizuFont = {
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
