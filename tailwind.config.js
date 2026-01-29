/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '375px',  // Small phones
      'sm': '640px',  // Default Tailwind
      'md': '768px',  // Default Tailwind
      'lg': '1024px', // Default Tailwind
      'xl': '1280px', // Default Tailwind
      '2xl': '1536px', // Default Tailwind
    },
    extend: {
      colors: {
        // Primary palette - harsh
        ivory: {
          light: '#FAF9F5',
          medium: '#F0EEE6',
          dark: '#E8E6DC',
        },
        slate: {
          dark: '#0a0a09',
          medium: '#3D3D3A',
          light: '#5E5D59',
        },
        clay: {
          DEFAULT: '#D97757',
          deep: '#C6613F',
        },
        cloud: {
          light: '#D1CFC5',
          medium: '#B0AEA5',
        },
        // Danger colors - industrial warning
        danger: {
          orange: '#FF6B35',
          black: '#0a0a09',
        },
        // LARP accent colors
        larp: {
          yellow: '#FFD93D',
          red: '#E74C3C',
          green: '#2ECC71',
          purple: '#9B59B6',
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'SF Mono', 'Consolas', 'monospace'],
        display: ['IBM Plex Mono', 'SF Mono', 'Consolas', 'monospace'],
        sans: ['IBM Plex Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'glitch': 'glitch 0.3s ease-in-out infinite',
        'progress-stuck': 'progress-stuck 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'typing': 'typing 3.5s steps(40, end)',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'stripe-move': 'stripe-move 20s linear infinite',
        'flicker': 'flicker 3s infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'expand-line': 'expandLine 0.4s ease-out forwards',
        'pop-in': 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'ping-slow': 'pingSlow 1.5s ease-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'wave': 'wave 0.8s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-3px, 3px)' },
          '40%': { transform: 'translate(-3px, -3px)' },
          '60%': { transform: 'translate(3px, 3px)' },
          '80%': { transform: 'translate(3px, -3px)' },
        },
        'progress-stuck': {
          '0%': { width: '0%' },
          '90%': { width: '99%' },
          '100%': { width: '99%' },
        },
        float: {
          '0%': { transform: 'translate(0px, 0px)' },
          '25%': { transform: 'translate(8px, -12px)' },
          '50%': { transform: 'translate(-4px, -20px)' },
          '75%': { transform: 'translate(-10px, -8px)' },
          '100%': { transform: 'translate(0px, 0px)' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'stripe-move': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 0' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '41%': { opacity: '1' },
          '42%': { opacity: '0.8' },
          '43%': { opacity: '1' },
          '45%': { opacity: '0.3' },
          '46%': { opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        expandLine: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        popIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pingSlow: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        wave: {
          '0%, 100%': { height: '4px' },
          '50%': { height: '12px' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
        'grid': "linear-gradient(to right, #D1CFC520 1px, transparent 1px), linear-gradient(to bottom, #D1CFC520 1px, transparent 1px)",
        'danger-stripe': "repeating-linear-gradient(45deg, #FF6B35, #FF6B35 10px, #0a0a09 10px, #0a0a09 20px)",
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
      boxShadow: {
        'brutal': '4px 4px 0 #0a0a09',
        'brutal-orange': '4px 4px 0 #FF6B35',
        'brutal-hover': '2px 2px 0 #0a0a09',
      },
    },
  },
  plugins: [],
}
