let mix = require("laravel-mix");
require("mix-tailwindcss");

mix
  .sass("src/master.scss", "assets/css/")
  .options({ processCssUrls: false })
  .tailwind("./tailwind.config.js")
  .webpackConfig({
    stats: {
      children: true,
    },
  });
