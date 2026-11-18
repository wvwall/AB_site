import { defineConfig } from "astro/config";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  site: "https://www.abwinetrader.com",
  build: {
    // Inline the (small) stylesheet into each page. When two pages share the
    // same CSS, the bundler emits it as a shared chunk named ".Layout.<hash>.css";
    // Netlify skips dot-files on deploy, so the site would load with no styles.
    inlineStylesheets: "always",
  },
  vite: {
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    },
  },
});
