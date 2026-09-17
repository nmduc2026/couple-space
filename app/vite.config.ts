/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Vite không mặc định treat `.geojson` như JSON — cần bọc `export default`. */
function geojsonAsJson(): Plugin {
  return {
    name: 'geojson-as-json',
    transform(code, id) {
      const file = id.split('?', 1)[0] ?? id
      if (!file.endsWith('.geojson')) return null
      return {
        code: `export default ${code}`,
        map: null,
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    geojsonAsJson(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.svg', 'push-sw.js'],
      workbox: {
        importScripts: ['/push-sw.js'],
        // SPA: mọi route đều về index.html; tránh 404 trắng khi mở deep link offline/cache.
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'Couple Space',
        short_name: 'Couple Space',
        description: 'Không gian chung của hai người',
        theme_color: '#e11d48',
        background_color: '#fdfcfb',
        display: 'standalone',
        start_url: '/',
        lang: 'vi',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
