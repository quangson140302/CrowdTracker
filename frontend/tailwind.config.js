module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          light: '#3b82f6',  // blue-500
          dark: '#1e40af',   // blue-800
        },
        secondary: {
          DEFAULT: '#f59e42', // orange-400
          light: '#fbbf24',  // orange-300
          dark: '#b45309',   // orange-800
        },
        heading: {
          DEFAULT: '#FFF', // slate-900
          light: '#334155',   // slate-700
          dark: '#fbbf24',    // orange-300 (for dark mode)
        },
      },
    },
  },
  plugins: [],
} 