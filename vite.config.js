import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/create_preference': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/confirm_transfer': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            }
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'index.html'),
            },
        },
    },
})
