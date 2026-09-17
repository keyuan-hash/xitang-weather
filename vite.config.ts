import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'favicon.svg'],
      manifest: {
        id: './',
        name: '喜糖天气 · Xitang Weather',
        short_name: '喜糖天气',
        description: '每一种天气，都有喜糖陪你。',
        lang: 'zh-CN',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#f3efe8',
        background_color: '#f4f1eb',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpeg,jpg,webp,webmanifest}'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Weather stays network-only here. useWeather owns the timestamped 24-hour cache.
        runtimeCaching: [],
        navigateFallback: 'index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
  base: './',
  server: { port: 5173, strictPort: true },
});
