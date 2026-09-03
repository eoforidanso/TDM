import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from https://eoforidanso.github.io/TDM/ — a project page, not a
  // user/org page, so every asset URL needs this prefix.
  base: '/TDM/',
})
