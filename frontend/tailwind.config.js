/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0a0f1e',
        primary: '#7c3aed',
        accent: '#c4b5fd',
        glass: 'rgba(255,255,255,0.08)'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(196,181,253,0.2), 0 12px 42px rgba(76,29,149,0.35)'
      }
    }
  },
  plugins: []
};
