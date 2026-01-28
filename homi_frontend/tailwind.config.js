/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ========== PALETTE ROYALE - COULEURS NOBLES ==========
      colors: {
        // Or Royal
        gold: {
          50: '#FFFEF9',
          100: '#FFF4C4',
          200: '#FFED4E',
          300: '#FFD700',
          400: '#F4C430',
          500: '#C9A400',
          600: '#B8941F',
          700: '#8B7500',
          800: '#6B5010',
          900: '#4A370B',
        },
        // Pourpre Impérial
        purple: {
          50: '#F5F0F9',
          100: '#E6D9F0',
          200: '#C8B3E0',
          300: '#9B72C0',
          400: '#6B3FA0',
          500: '#4A1F70',
          600: '#2E1545',
          700: '#1A0D2E',
          800: '#120A1A',
          900: '#0A050F',
        },
        // Bleu Royal
        royal: {
          50: '#EFF3FF',
          100: '#DBE4FF',
          200: '#B6CBFF',
          300: '#91B2FF',
          400: '#3B82F6',
          500: '#1E40AF',
          600: '#1E3A8A',
          700: '#0C1E4A',
          800: '#050B1F',
          900: '#03050D',
        },
        // Ivoire & Marbre
        ivory: {
          50: '#FFFFFF',
          100: '#FFFEF9',
          200: '#FFF9E6',
          300: '#F7F5E8',
          400: '#EAE7D6',
          500: '#C9C5B5',
          600: '#9A9786',
          700: '#6B6A5E',
          800: '#3C3B36',
          900: '#1C1B19',
        },
        // Obsidienne (Noirs profonds)
        obsidian: {
          50: '#F5F5F5',
          100: '#E0E0E0',
          200: '#B0B0B0',
          300: '#808080',
          400: '#505050',
          500: '#2A2A2A',
          600: '#1A1A1A',
          700: '#0A0A0A',
          800: '#050505',
          900: '#000000',
        },
        // Accents Précieux
        ruby: {
          500: '#DC2626',
          600: '#991B1B',
          700: '#7A1416',
        },
        emerald: {
          500: '#059669',
          600: '#047857',
          700: '#065F46',
        },
        sapphire: {
          500: '#0891B2',
          600: '#0E7490',
          700: '#155E75',
        },
      },
      
      // ========== TYPOGRAPHIE ROYALE ==========
      fontFamily: {
        royal: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      
      // ========== DÉGRADÉS ROYAUX ==========
      backgroundImage: {
        'royal-gradient': 'linear-gradient(135deg, #2E1545 0%, #0C1E4A 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C9A400 0%, #FFD700 50%, #FFF4C4 100%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.3) 50%, transparent 100%)',
        'throne-gradient': 'linear-gradient(180deg, #0A0A0A 0%, #1A0D2E 50%, #050B1F 100%)',
        'marble-gradient': 'linear-gradient(135deg, #FFFEF9 0%, #F7F5E8 100%)',
        'obsidian-gradient': 'linear-gradient(180deg, #0A0A0A 0%, #1A1A1A 100%)',
        'vitrail-gradient': 'linear-gradient(135deg, rgba(107, 63, 160, 0.08) 0%, rgba(30, 64, 175, 0.08) 100%)',
        'radial-gold': 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%)',
      },
      
      // ========== OMBRES ROYALES (Chandelles) ==========
      boxShadow: {
        'xs': '0 1px 3px rgba(10, 10, 10, 0.08)',
        'sm': '0 2px 8px rgba(10, 10, 10, 0.12)',
        'md': '0 4px 16px rgba(10, 10, 10, 0.16)',
        'lg': '0 8px 32px rgba(10, 10, 10, 0.2)',
        'xl': '0 12px 48px rgba(10, 10, 10, 0.25)',
        '2xl': '0 20px 64px rgba(10, 10, 10, 0.35)',
        'gold': '0 4px 24px rgba(255, 215, 0, 0.4)',
        'gold-glow': '0 0 32px rgba(255, 215, 0, 0.5)',
        'inner': 'inset 0 2px 8px rgba(10, 10, 10, 0.15)',
        'inner-light': 'inset 0 1px 3px rgba(10, 10, 10, 0.08)',
        'ornate': '0 8px 32px rgba(107, 63, 160, 0.2), 0 2px 8px rgba(255, 215, 0, 0.1)',
        'none': 'none',
      },
      
      // ========== ANIMATIONS & TRANSITIONS ==========
      transitionDuration: {
        'royal': '400ms',
        'smooth': '300ms',
      },
      transitionTimingFunction: {
        'royal': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // ========== BORDURES ORNEMENTALES ==========
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '6': '6px',
      },
      
      // ========== ESPACEMENTS SUPPLÉMENTAIRES ==========
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // ========== ANIMATION KEYFRAMES ==========
      keyframes: {
        'fade-in-royal': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-royal': {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(-20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'shimmer-gold': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 15px rgba(255, 215, 0, 0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.4))' },
        },
        'spin': {
          'to': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in-royal': 'fade-in-royal 0.6s ease-out',
        'slide-in-royal': 'slide-in-royal 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shimmer-gold': 'shimmer-gold 3s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
      },
      
      // ========== BACKDROP BLUR ==========
      backdropBlur: {
        'royal': '20px',
      },
      
      // ========== Z-INDEX SYSTEM ==========
      zIndex: {
        'base': '1',
        'elevated': '10',
        'floating': '100',
        'overlay': '1000',
        'modal': '1100',
        'navigation': '2000',
        'toast': '3000',
      },
    },
  },
  plugins: [],
}
