import { defineConfig } from "astro/config";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  site: "https://www.abwinetrader.com",
  vite: {
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    },
  },
});
