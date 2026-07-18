module.exports = {
  content: ["./src/**/*.{astro,html,js,ts}"],
  darkMode: "class",
  theme: {
    screens: {
      xs: "320px",
      sm: "480px",
      md: "768px",
      lg: "976px",
      xl: "1023px",
      xxl: "1440px",
    },
    extend: {
      colors: {
        black: "#000000",
        blackFooter: "#121212",
        blackMain: "#000000",
        white: "#fff",
      },
      boxShadow: {
        "3xl": "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
        "4xl":
          "0 2px 4px rgba(255, 255, 255, 0.16), 0 2px 4px rgba(255, 255, 255, 0.23)",
      },
    },
  },
  plugins: [],
};
