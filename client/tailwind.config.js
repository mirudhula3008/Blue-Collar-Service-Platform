/** @type {import('tailwindcss').Config} */

// Blue-Collar Services theme (see BlueCollar-Services-Theme-Guide.pdf).
// The standard blue / slate / emerald / amber scales are remapped to the theme
// so existing utility classes pick up the palette automatically.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B2A4A',
        // Service Blue — primary accent, links, CTAs
        blue: {
          50: '#E8EEFF', // --blue-muted
          100: '#D6E0FF',
          200: '#B8C9FF',
          300: '#8FAAFF',
          400: '#5B8AFF', // --blue-light
          500: '#4775FF',
          600: '#3366FF', // --blue
          700: '#2952D9',
          800: '#2142AD',
          900: '#1B2A4A',
        },
        // Neutrals — section background, borders, muted and main text
        slate: {
          50: '#F1F4F9', // --bg-section
          100: '#E9EDF4',
          200: '#DFE4ED', // --border
          300: '#C9D1DF',
          400: '#8A9ABD',
          500: '#5A6A85', // --fg-muted
          600: '#4D5C76',
          700: '#364563',
          800: '#253456',
          900: '#1B2A4A', // --fg / --navy
        },
        // Green — verified, available, success
        emerald: {
          50: '#E3F5EE', // --green-light
          100: '#C9EBDD',
          200: '#A6DDC6',
          300: '#6FC7A2',
          400: '#45B788',
          500: '#2AA876', // --green
          600: '#2AA876',
          700: '#1F8A5F',
          800: '#176B4A',
        },
        // Amber — CTA accent, stars, negotiable
        amber: {
          50: '#FFF6E8',
          100: '#FFEACC', // --amber-light
          200: '#FFDCA8',
          300: '#FBC56A',
          400: '#F5A623', // --amber
          500: '#F5A623',
          600: '#D98C0E',
          700: '#A86A06',
          800: '#8A5A0B',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(27, 42, 74, 0.04), 0 2px 8px rgba(27, 42, 74, 0.05)',
        lift: '0 4px 16px rgba(27, 42, 74, 0.08)',
        glow: '0 0 0 4px rgba(51, 102, 255, 0.15)',
      },
    },
  },
  plugins: [],
};
