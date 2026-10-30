import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: './', // Ensures relative assets so Android WebView can load directly from android_asset or local file
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          id: '/',
          name: 'MetroGenesis 3D - City Builder',
          short_name: 'MetroGenesis',
          description: 'Expansive 3D low-poly city builder with animated transit, seasons, day/night cycle, and local music player.',
          theme_color: '#0f172a',
          background_color: '#020617',
          display: 'standalone',
          orientation: 'any',
          start_url: './',
          scope: './',
          icons: [
            {
              src: './icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: './icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
