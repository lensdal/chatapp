/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#F3EDFB',
        ink: '#17141F',
        violet: {
          DEFAULT: '#7C5CFC',
          soft: '#EDE7FF',
        },
        sky: {
          DEFAULT: '#5B8DEF',
          soft: '#DCE7FB',
        },
        blush: {
          DEFAULT: '#E45FCF',
          soft: '#FBE1F6',
        },
        sun: {
          DEFAULT: '#F5B93E',
          soft: '#FCEFCF',
        },
        tang: {
          DEFAULT: '#F07E3E',
          soft: '#FCE4D3',
        },
        mint: {
          DEFAULT: '#3FB984',
          soft: '#D6F2E4',
        },
      },
      boxShadow: {
        card: '0 8px 30px -12px rgba(60, 30, 100, 0.18)',
        soft: '0 4px 16px -8px rgba(60, 30, 100, 0.15)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
