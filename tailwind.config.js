/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        funnel: ["var(--font-funnel-display)", "sans-serif"],
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
};

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        funnel: ["var(--font-funnel-display)", "sans-serif"],
      },
    },
  },
};
