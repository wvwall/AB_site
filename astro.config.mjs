import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://www.abwinetrader.com",
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
