import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/maison-seeker/',
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "${path.resolve(__dirname, 'src/styles/_variables.scss').replace(/\\/g, '/')}" as *; @use "${path.resolve(__dirname, 'src/styles/_mixins.scss').replace(/\\/g, '/')}" as *;`,
      },
    },
  },
})
