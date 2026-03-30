import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark theme palette matching admin portal
        background: {
          DEFAULT: '#0B0F14',
          surface: '#121821',
          border: '#1E293B',
        },
        primary: {
          DEFAULT: '#00E676',
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
        },
        secondary: {
          DEFAULT: '#38BDF8',
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
        },
        text: {
          DEFAULT: '#E5E7EB',
          muted: '#9CA3AF',
        },
        success: '#00E676',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#38BDF8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(0, 230, 118, 0.39)',
        'primary-lg': '0 6px 20px rgba(0, 230, 118, 0.5)',
        'card': '0 8px 30px rgba(0, 230, 118, 0.12)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00E676 0%, #38BDF8 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0B0F14 0%, #121821 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
