import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// base = nombre del repo para GitHub Pages (davilan21.github.io/todocosturas-demo/)
export default defineConfig({
  base: '/todocosturas-demo/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
})
