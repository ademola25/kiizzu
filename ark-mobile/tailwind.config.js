/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // TENTZU calm-turquoise tokens. The semantic names are kept (so existing
      // className usage stays valid) but retargeted from the old Cal-AI
      // monochrome to the brand palette.
      colors: {
        ink: '#1a1c1e', // primary text (cool near-black)
        paper: '#FFFFFF', // cards / base surface
        mist: '#f0f5f5', // section / page background (soft teal-grey)
        line: '#dfe9e8', // hairline borders
        muted: '#6b7a79', // secondary text
        brand: '#006a6a', // turquoise — primary actions / active states
        'brand-bright': '#00b8bb', // mid accent
        wash: '#e8f6f6', // soft teal fill (selected / chips)
        danger: '#ba1a1a', // errors
        amber: '#f0a52a', // due-soon / caution
        flame: '#FF6B35', // legacy accent (being phased out)
        // Full brand namespace (also used inline via theme/tokens.ts `tentzu`).
        tentzu: {
          primary: '#006a6a',
          'primary-container': '#00d7d7',
          secondary: '#50606f',
          bg: '#f9f9fc',
          ink: '#1a1c1e',
          'ink-variant': '#3b4949',
          outline: '#bacac9',
        },
      },
      borderRadius: {
        card: '26px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
      // Mirrors `fontSize` in src/theme/tokens.ts. Declared rather than
      // inherited from Tailwind so the className path and the inline-style
      // path resolve to one scale; these are the values already in use, so
      // nothing moves.
      fontSize: {
        xs: '12px',    // fine
        sm: '14px',    // label
        base: '16px',  // subtitle
        lg: '18px',    // lead
        xl: '20px',    // section
        '2xl': '24px', // title
        '3xl': '30px', // display
        '4xl': '36px', // jumbo
      },
    },
  },
  plugins: [],
};
