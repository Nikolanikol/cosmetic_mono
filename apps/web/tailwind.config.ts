import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: {
            900: '#0A0A0A',
            800: '#111111',
            700: '#1A1A1A',
            600: '#2A2A2A',
            500: '#333333',
          },
          pink: {
            300: '#FF99C2',
            400: '#FF4D95',
            500: '#FF1A75',
            600: '#CC0052',
          },
          charcoal: {
            100: '#E5E5E5',
            200: '#CCCCCC',
            300: '#AAAAAA',
            400: '#888888',
            500: '#666666',
            600: '#444444',
          },
          rose: {
            500: '#E53E3E',
          },
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
