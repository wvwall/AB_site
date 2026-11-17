# AB Winetrader [![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML) [![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS) [![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![Webpack](https://img.shields.io/badge/webpack-%238DD6F9.svg?style=for-the-badge&logo=webpack&logoColor=black)](https://webpack.js.org/) [![SASS](https://img.shields.io/badge/SASS-hotpink.svg?style=for-the-badge&logo=SASS&logoColor=white)](https://sass-lang.com/)

This is a static website built with HTML, CSS (Tailwind CSS), and JavaScript. It utilizes Webpack Mix for asset compilation.

This project serves as the online presence for AB Winetrader, an enoteca specializing in fine wines, champagne, and sought-after labels. The website provides information about their selection and allows customers to download a wine list and contact them via WhatsApp.

## Table of Contents

- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Contact](#contact)

## About The Project

This is a static website built with HTML, CSS (Tailwind CSS), and JavaScript. It utilizes Webpack Mix for asset compilation.

This project serves as the online presence for AB Winetrader, an enoteca specializing in fine wines, champagne, and sought-after labels. The website provides information about their selection and allows customers to download a wine list and contact them via WhatsApp.

## Built With

- HTML
- CSS
- JavaScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Laravel Mix](https://laravel-mix.com/)
- [SASS](https://sass-lang.com/)

### Wine List upload

The "Wine List" button points to `/lista-vini.pdf`, served by the Netlify Function
`netlify/functions/wine-list.mts` from Netlify Blobs. To update the file, open
`/admin/lista-vini`, log in and drop the new PDF: it is online immediately, no deploy needed.
The previous version is kept and can be restored with one click. Until a file is uploaded,
the function redirects to the static `public/WineList.pdf`.

Setup: set `WINE_LIST_ADMIN_PASSWORD` in Netlify (Site configuration → Environment variables,
scope "Functions"). For local development use `netlify dev` (functions and Blobs do not run
under `astro dev`).

### Language Toggle

The website includes a language toggle feature to switch between Italian and English content.
