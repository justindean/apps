import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        slate: {
          925: '#0b1120',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
