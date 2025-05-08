import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configuração para garantir que as variáveis de ambiente .env sejam carregadas
  envPrefix: 'VITE_',
})
