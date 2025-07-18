import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Conditionally import vueDevTools only in development
let vueDevTools
try {
  vueDevTools = (await import('vite-plugin-vue-devtools')).default
} catch {
  // vite-plugin-vue-devtools not available in production
  vueDevTools = null
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ...(vueDevTools ? [vueDevTools()] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  preview: {
    allowedHosts: ['music-hub-platform.onrender.com'],
  },
})
