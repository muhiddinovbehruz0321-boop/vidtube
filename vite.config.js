import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/vidtube/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/youtube/v3': {
        target: 'http://127.0.0.1:4174',
        changeOrigin: true,
      },
    },
  },
})
