/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Purple/White Professional Theme
        primary: {
          50: '#F5F3FF',   // Brand Surface
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',  // Primary Brand - Main CTA
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',  // Deep Anchor - Sidebar/Header
          950: '#2E1065',
        },
        slate: {
          50: '#F8FAFC',   // Global Background
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',  // Text Secondary
          600: '#475569',
          700: '#334155',
          800: '#1E293B',  // Text Primary
          900: '#0F172A',
          950: '#020617',
        },
        success: {
          50: '#ECFDF5',
          500: '#10B981', // Emerald - Success states
          600: '#059669',
        },
        danger: {
          50: '#FFF1F2',
          500: '#F43F5E', // Rose - Destructive actions
          600: '#E11D48',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B', // Amber
          600: '#D97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'page-title': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'section-header': ['18px', { lineHeight: '28px', fontWeight: '500' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'data': ['13px', { lineHeight: '18px', fontWeight: '400' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
