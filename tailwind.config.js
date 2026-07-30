module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0A0A0C',
        surface: '#151518',
        card: '#1C1C21',
        cardHover: '#242429',
        elevated: '#2A2A30',
        borderSubtle: '#2A2A2E',
        borderFocus: '#4C4CFF',
        textPrimary: '#F5F5F7',
        textSecondary: '#A1A1AA',
        textMuted: '#6B6B72',
        textLink: '#8B8CF6',
        accent: '#6C5CE7',
        accentHover: '#7D6EF0',
      },
    },
  },
  plugins: [],
}