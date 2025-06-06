/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 使用类切换，而不是媒体查询
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
        // --- BEGIN COMMENT ---
        // 🎯 Claude 风格的中英文字体配置
        // sans: Inter + 思源黑体 - 现代简洁的界面字体
        // serif: Crimson Pro + 思源宋体 - 优雅易读的阅读字体
        // display: Playfair Display + 思源黑体 - 装饰性标题字体
        // --- END COMMENT ---
        sans: [
          'var(--font-inter)', 
          'var(--font-noto-sans)', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'system-ui', 
          'sans-serif'
        ],
        serif: [
          'var(--font-crimson)', 
          'var(--font-noto-serif)', 
          'Georgia', 
          'serif'
        ], 
        display: [
          'var(--font-playfair)', 
          'var(--font-noto-sans)', 
          'serif'
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'slide-in-down': 'slideInDown 0.3s ease-out forwards',
        'slide-out-up': 'slideOutUp 0.3s ease-in forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
        'bounce-subtle': 'bounceSubtle 1s infinite',
        'fadein': 'fadeIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'blink': 'blink 1s step-end infinite',
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
        sm: 'calc(var(--radius) - 4px)'
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
} 