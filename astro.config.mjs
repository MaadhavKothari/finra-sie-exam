import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';

// When BUILD_TARGET=ios we build for the Capacitor WKWebView, which serves
// files from the bundle root. GitHub Pages serves under /finra-sie-exam.
const isIOS = process.env.BUILD_TARGET === 'ios';

export default defineConfig({
  site: isIOS ? undefined : 'https://maadhavkothari.github.io',
  base: isIOS ? '/' : '/finra-sie-exam',
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
