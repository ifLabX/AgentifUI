/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Use class strategy for dark mode instead of media query
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        // Global serif font configuration - all font families point to serif fonts
        // sans: Crimson Pro + Noto Serif + Georgia + serif fallback
        // serif: Crimson Pro + Noto Serif + Georgia + serif fallback
        // display: Playfair Display + Noto Serif + serif fallback
        sans: [
          'var(--font-crimson)',
          'var(--font-noto-serif)',
          'Georgia',
          'serif',
        ],
        serif: [
          'var(--font-crimson)',
          'var(--font-noto-serif)',
          'Georgia',
          'serif',
        ],
        display: ['var(--font-playfair)', 'var(--font-noto-serif)', 'serif'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Menlo',
          'monospace',
        ],
      },
      animation: {
        'slide-in-down': 'slideInDown 0.3s ease-out forwards',
        'slide-out-up': 'slideOutUp 0.3s ease-in forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
        'bounce-subtle': 'bounceSubtle 1s infinite',
        fadein: 'fadeIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        blink: 'blink 1s step-end infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'slide-out-right': 'slideOutRight 0.3s ease-in forwards',
      },
      keyframes: {
        slideInDown: {
          '0%': { transform: 'translateY(-10%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideOutUp: {
          '0%': { transform: 'translateY(0)', opacity: 1 },
          '100%': { transform: 'translateY(-10%)', opacity: 0 },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.03)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: 1 },
          '100%': { transform: 'translateX(100%)', opacity: 0 },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require('tailwind-scrollbar')({ nocompatible: true })],
};
