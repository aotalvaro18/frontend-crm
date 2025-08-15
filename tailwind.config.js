// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ✅ ESTA ES LA CORRECCIÓN CLAVE
      // Ahora definimos AMBAS cosas que tu aplicación necesita:
      colors: {
        // 1. La paleta de colores anidada que tu `globals.css` usa con `theme()`.
        //    (He usado los colores de los comentarios de tu CSS).
        app: {
          dark: {
            '900': '#0f0f0f',
            '800': '#1a1a1a',
            '700': '#2a2a2a',
            '600': '#3a3a3a',
            '500': '#4a4a4a',
          },
          gray: {
            '300': '#c5c5c5',
            '200': '#e5e5e5',
            '100': '#f5f5f5',
            '400': '#a5a5a5',
            '500': '#858585',
          },
          accent: {
            '500': '#6366f1',
            '700': '#4338ca',
            '600': '#5b5bf6',
            '50': '#eef2ff',
          },
        },
        // 2. Los colores semánticos que generan las clases como 'bg-background'.
        //    Estos usan las variables CSS que TÚ definiste en `globals.css`.
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}