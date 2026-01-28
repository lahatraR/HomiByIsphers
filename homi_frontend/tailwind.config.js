/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Palette Royale - Couleurs Nobles
      colors: {
        // Or Royal
        gold: {
          50: '#FFFEF7',
          100: '#F4E4C1',
          200: '#E8D19F',
          300: '#DCBE7D',
          400: '#D4AF37',
          500: '#B8941F',
          600: '#8B6914',
          700: '#6B5010',
          800: '#4A370B',
          900: '#2A1F06',
        },
        // Pourpre Impérial
        purple: {
          50: '#F5F0F9',
          100: '#E6D9F0',
          200: '#C8B3E0',
          300: '#AA8DD1',
          400: '#8B6AA8',
          500: '#5D3A7E',
          600: '#3E2555',
          700: '#2A1A3A',
          800: '#1D1228',
          900: '#120A1A',
        },
        // Bleu Royal
        royal: {
          50: '#EFF3FF',
          100: '#DBE4FF',
          200: '#B6CBFF',
          300: '#91B2FF',
          400: '#3B5998',
          500: '#1E3A8A',
          600: '#0F1D4A',
          700: '#0A1128',
          800: '#060B19',
          900: '#03050D',
        },
        // Ivoire & Marbre
        ivory: {
          50: '#FFFFFF',
          100: '#FFFEF7',
          200: '#F5F3E8',
          300: '#E8E6DA',
          400: '#D6D3C4',
          500: '#C4C0B2',
          600: '#A8A49A',
          700: '#8C8882',
          800: '#5D5A54',
          900: '#2E2C29',
        },
        // Accents Précieux
        ruby: {
          500: '#9B2226',
          600: '#7A1B1E',
          700: '#5A1416',
        },
        emerald: {
          500: '#2D6A4F',
          600: '#1B4332',
          700: '#081C15',
        },
        sapphire: {
          500: '#1A5F7A',
          600: '#114B5F',
          700: '#0A3744',
        },
      },
      
      // Typographie Royale
      fontFamily: {
        royal: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      
      // Dégradés Royaux
      backgroundImage: {
        'royal-gradient': 'linear-gradient(135deg, #3E2555 0%, #0F1D4A 100%)',
        'gold-gradient': 'linear-gradient(135deg, #B8941F 0%, #D4AF37 50%, #F4E4C1 100%)',
        'throne-gradient': 'linear-gradient(180deg, #2A1A3A 0%, #0A1128 100%)',
        'marble-gradient': 'linear-gradient(135deg, #FFFEF7 0%, #E8E6DA 100%)',
        'vitrail-gradient': 'linear-gradient(135deg, rgba(93, 58, 126, 0.1) 0%, rgba(30, 58, 138, 0.1) 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #B8941F 0%, #D4AF37 50%, #F4E4C1 75%, #D4AF37 100%)',
      },
      
      // Ombres Royales (Chandelles)
      boxShadow: {
        'soft': '0 2px 8px rgba(212, 175, 55, 0.1)',
        'medium': '0 4px 16px rgba(93, 58, 126, 0.15)',
        'deep': '0 8px 32px rgba(30, 58, 138, 0.2)',
        'royal': '0 12px 48px rgba(26, 26, 26, 0.25)',
        'gold': '0 4px 20px rgba(212, 175, 55, 0.3)',
        'gold-glow': '0 0 30px rgba(212, 175, 55, 0.5)',
        'inner': 'inset 0 2px 8px rgba(0, 0, 0, 0.1)',
        'ornate': '0 8px 32px rgba(93, 58, 126, 0.2), 0 2px 8px rgba(212, 175, 55, 0.1)',
      },
      
      // Animations & Transitions Élégantes
      transitionDuration: {
        'royal': '400ms',
      },
      transitionTimingFunction: {
        'royal': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // Bordures Ornementales
      borderWidth: {
        '3': '3px',
      },
      
      // Espacements pour l'élégance
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Animation keyframes
      keyframes: {
        'fade-in-royal': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer-gold': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(212, 175, 55, 0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in-royal': 'fade-in-royal 0.6s ease-out',
        'shimmer-gold': 'shimmer-gold 3s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      
      // Backdrop blur pour effets vitraux
      backdropBlur: {
        'royal': '20px',
      },
    },
  },
  plugins: [],
}
