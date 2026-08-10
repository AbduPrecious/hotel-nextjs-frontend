// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'carmelina-dark': '#0A0A0A',
        'carmelina-dark-light': '#1A1A1A',
        'carmelina-gold': '#C8A87C',
        'carmelina-gold-light': '#E8D5B8',
        'carmelina-gold-dark': '#B8945C',
        'carmelina-gray': '#A0A0A0',
        'carmelina-border': '#333333',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;