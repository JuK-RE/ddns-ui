import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    // Necessário pro Vite aceitar requisições que chegam com um Host
    // diferente de localhost — é o caso do Cloudflare Tunnel, que expõe
    // o dev server num domínio próprio (vite.juk.re).
    allowedHosts: ['vite.juk.re'],
  },
})
