/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Cal AI design tokens — monochrome + flame accent.
      colors: {
        ink: '#000000', // primary text / buttons
        paper: '#FFFFFF', // base background
        mist: '#F5F5F5', // app/section background
        line: '#EAEAEA', // hairline borders
        muted: '#8A8A8E', // secondary text
        flame: '#FF6B35', // streak / accent
        // Kizu brand palette (welcome/landing + future rebrand)
        kizu: {
          primary: '#006a6a', // turquoise — primary actions / accent
          'primary-container': '#00d7d7',
          secondary: '#50606f', // snow-leopard slate
          bg: '#f9f9fc', // cool near-white background
          ink: '#1a1c1e', // on-surface text
          'ink-variant': '#3b4949', // secondary text
          outline: '#bacac9', // hairlines / inactive dots
        },
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
};
