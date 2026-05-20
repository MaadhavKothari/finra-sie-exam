import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://maadhavkothari.github.io',
  base: '/finra-sie-exam',
  vite: {
    plugins: [tailwindcss()],
  },
});
