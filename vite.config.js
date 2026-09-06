import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from a GitHub Pages *project* page (https://<user>.github.io/Fitness-PWA/),
// so production builds need that repo-name subpath; local dev serves from '/'.
const REPO_NAME = 'Fitness-PWA'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'FitFive',
        short_name: 'FitFive',
        description: 'A fitness plan built around your Friday five-a-side football match.',
        theme_color: '#faf9f6',
        background_color: '#faf9f6',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The exercise library (~1MB) isn't precached with the app shell —
        // cache it after its first fetch so it's available offline from then on.
        runtimeCaching: [
          {
            urlPattern: /exercises\.json$/,
            handler: 'CacheFirst',
            options: { cacheName: 'exercise-data' },
          },
        ],
      },
    }),
  ],
}))
