import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: (() => {
    const normalize = (v: string) => (v.endsWith('/') ? v : `${v}/`)

    const explicit = process.env.VITE_BASE
    if (explicit) return normalize(explicit)

    // GitHub Actions provides GITHUB_REPOSITORY=owner/name.
    // Using this as a fallback makes Pages deployments harder to misconfigure.
    const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
    if (repo) return `/${repo}/`

    return '/'
  })(),
  plugins: [
    react(),
    VitePWA({
      injectRegister: null,
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png', 'favicon.ico'],
      manifest: {
        name: 'Hifz Companion',
        short_name: 'Hifz',
        description: 'Calm hifz practice: recite, then reveal the answer.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#fbf3e6',
        theme_color: '#0e7490',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/fawazahmed0\/quran-api@1\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'quran-api',
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
