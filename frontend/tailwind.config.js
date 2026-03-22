/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        surface: {
          DEFAULT: '#18181b',
          2: '#27272a',
          3: '#3f3f46',
        },
        zinc: {
          950: '#09090b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'gradient-rose': 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
        'gradient-amber': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        'mesh': 'radial-gradient(at 40% 20%, hsla(270,60%,30%,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(280,50%,20%,0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(260,40%,20%,0.15) 0px, transparent 50%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.15)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
