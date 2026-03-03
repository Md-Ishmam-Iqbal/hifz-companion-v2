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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: null,
      registerType: 'autoUpdate',
      includeAssets: [
        'pwa-192.png',
        'pwa-512.png',
        'pwa-maskable-512.png',
        'apple-touch-icon.png',
        'favicon.ico',
      ],
      manifest: {
        name: 'Hifz Companion',
        short_name: 'Hifz Companion',
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
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
