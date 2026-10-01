import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Asegúrate de tener esta importación correcta si usas Tailwind

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
})