import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

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
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
