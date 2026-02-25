 import { defineConfig } from 'vite'
 import react from '@vitejs/plugin-react'
 import tailwindcss from '@tailwindcss/vite'
 import { resolve } from 'path'

 import { fileURLToPath } from 'url'
 
 // https://vite.dev/config/
 export default defineConfig({
     plugins: [react(), tailwindcss()],
     build: {
         rollupOptions: {
             input: {main: resolve(new URL('.', import.meta.url).pathname, 'index.html'), main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'index.html'),
             },
         },
     },
 })

