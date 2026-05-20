import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://maadhavkothari.github.io',
  base: '/finra-sie-exam',
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
