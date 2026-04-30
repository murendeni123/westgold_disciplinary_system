/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // New Design System Colors
        'primary-bg': '#F2EBE2',
        'card-bg': '#121821',
        'border-line': '#1E293B',
        'accent-green': '#00E676',
        'accent-cyan': '#38BDF8',
        'text-main': '#E5E7EB',
        'text-muted': '#9CA3AF',
        // Keep existing primary for backwards compatibility
        primary: {
          50: '#E0FFF4',
          100: '#B3FFE5',
          200: '#80FFD4',
          300: '#4DFFC3',
          400: '#26FFB6',
          500: '#00E676',
          600: '#00D96E',
          700: '#00CC66',
          800: '#00BF5E',
          900: '#00A84E',
          DEFAULT: '#00E676',
        },
        secondary: {
          50: '#E0F2FE',
          100: '#BAE6FD',
          200: '#7DD3FC',
          300: '#38BDF8',
          400: '#0EA5E9',
          500: '#0284C7',
          600: '#0369A1',
          700: '#075985',
          800: '#0C4A6E',
          900: '#0A3A56',
          DEFAULT: '#38BDF8',
        },
      },
      backgroundImage: {
        // Premium gradient background (Stripe/Linear style)
        'gradient-premium': 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(30, 41, 59, 0.25) 50%, rgba(18, 24, 33, 0.6) 100%)',
        'gradient-radial-cyan': 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.15) 0%, transparent 50%)',
      },
      boxShadow: {
        'card': '0 8px 30px rgba(0, 230, 118, 0.12)',
        'card-hover': '0 12px 40px rgba(0, 230, 118, 0.2)',
        'primary': '0 4px 14px 0 rgba(0, 230, 118, 0.39)',
        'primary-lg': '0 6px 20px rgba(0, 230, 118, 0.5)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}



