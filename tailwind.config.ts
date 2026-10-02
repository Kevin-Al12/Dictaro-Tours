import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── D'Itaros brand red ── */
        brand: {
          50:  '#fff0f0',
          100: '#ffdede',
          200: '#ffbdbd',
          300: '#ff8f8f',
          400: '#ff5050',
          500: '#f51b2b',
          600: '#C41E2C',   // logo red
          700: '#a5121e',
          800: '#881318',
          900: '#6e1014',
          950: '#3e0508',
        },
        /* ── Navy backgrounds ── */
        navy: {
          50:  '#e8edf5',
          100: '#c5d1e5',
          200: '#9fb3d3',
          300: '#7994c1',
          400: '#5c7db5',
          500: '#3f66a9',
          600: '#395ea2',
          700: '#315398',
          800: '#29498f',
          900: '#1b357f',
          950: '#0A1628',
        },
        /* ── Red accent (matches brand) ── */
        gold: {
          50:  '#fff0f0',
          100: '#ffdcdc',
          200: '#ffb8b8',
          300: '#ff8080',
          400: '#f55050',
          500: '#C41E2C',
          600: '#a5121e',
          700: '#881318',
          800: '#6e1014',
          900: '#3e0508',
        },
        cream: '#F8F4EF',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        float:        'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer:      'shimmer 2s linear infinite',
        'slide-up':   'slideUp 0.5s ease-out',
        'fade-in':    'fadeIn 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
