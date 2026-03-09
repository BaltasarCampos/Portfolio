// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  image: {
    // Allow optimization of images in public/
    remotePatterns: [],
  },
  // Static output — all pages are pre-rendered at build time.
  // The /api/contact route is handled by the Netlify function (see netlify.toml redirect).
  output: 'static',
  build: {
    assets: 'assets',
    // T078 — split vendor chunks to enable granular caching and tree-shaking
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      // T078 — minimise JS bundle: React is only shipped with islands
      rollupOptions: {
        output: {
          // Separate react vendor chunk for better cache hits
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-motion';
            }
          },
        },
      },
    },
  },
});
