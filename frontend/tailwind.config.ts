import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0a0f1e',
        primary: '#7c3aed',
        accent: '#c4b5fd'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(196,181,253,0.25), 0 24px 64px rgba(124,58,237,0.35)'
      }
    }
  },
  plugins: []
};

export default config;
