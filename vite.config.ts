import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single-file build: inlines all JS, CSS and fonts into one self-contained
// index.html so the prototype can be hosted anywhere (or embedded) with no
// external requests. Dev server (`npm run dev`) is unaffected.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
  server: {
    host: true,
    port: 5173,
  },
})
