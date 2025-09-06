import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'la-dark-blue': '#1e40af',
        'la-light-blue': '#00bcd4',
        'la-yellow': '#ffd700',
        'la-background': '#ffffff',
        'la-light-background': '#e3f2fd',
        'la-text-primary': '#0f172a',
        'la-text-secondary': '#475569',
        'la-border': '#e2e8f0',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      boxShadow: {
        'soft': '0 4px 6px rgba(0, 0, 0, 0.07)',
        'medium': '0 10px 25px rgba(0, 0, 0, 0.08)',
        'large': '0 20px 40px rgba(0, 0, 0, 0.1)',
        'colored': '0 4px 12px rgba(255, 215, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;