import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ntc-logo.png'],
      manifest: {
        name: 'NTC Vehicle Management System',
        short_name: 'NTC Fleet',
        description: 'Nepal Telecom Fleet Management System',
        theme_color: '#004A99',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'ntc-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'ntc-logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'ntc-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  preview: {
    allowedHosts: true
  }
})
