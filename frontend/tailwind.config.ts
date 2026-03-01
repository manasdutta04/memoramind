import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#fcfcfc',
        night: '#111111',
        primary: '#3b82f6', // Bright, stark blue
        accent: '#eab308',  // Bold yellow
        alert: '#ef4444'    // Sharp red
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px rgba(17,17,17,1)',
        'brutal-sm': '2px 2px 0px 0px rgba(17,17,17,1)',
      }
    }
  },
  plugins: []
};

export default config;
