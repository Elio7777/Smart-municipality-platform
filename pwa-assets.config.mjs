import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Reads public/icon.svg and writes:
//   public/pwa-64x64.png
//   public/pwa-192x192.png
//   public/pwa-512x512.png
//   public/maskable-icon-512x512.png
//   public/apple-touch-icon-180x180.png
//   public/favicon.ico
// Re-run with: `npx pwa-assets-generator --preset minimal-2023 public/icon.svg`
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
})
