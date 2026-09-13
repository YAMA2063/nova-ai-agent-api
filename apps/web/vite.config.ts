import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true, // Listen on 0.0.0.0 so both laptop and phone on LAN can access
    port: 3000,
    proxy: {
      '/proxy/sambanova': {
        target: 'https://api.sambanova.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/sambanova/, '')
      },
      '/proxy/tokenharbor': {
        target: 'https://tokenharbor.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/tokenharbor/, '')
      }
    }
  }
})
