import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import { seoPlugin } from './vite-plugin-seo.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // Proxy do /api: o front só chama o próprio domínio e o Vite repassa pro
  // backend (em produção quem faz isso é a hospedagem — ver README). Assim
  // o endereço da API não aparece no site e o cookie de sessão é do mesmo
  // domínio do front.
  const apiProxy = {
    '/api': {
      // Compatibilidade: se o .env ainda tiver o VITE_API_URL antigo com URL
      // absoluta, ela vira o alvo do proxy (e o front usa "/api" mesmo assim).
      target:
        env.VITE_API_PROXY_TARGET ||
        (/^https?:\/\//.test(env.VITE_API_URL ?? '') ? env.VITE_API_URL : 'http://localhost:8787'),
      changeOrigin: true,
      // repassa o protocolo original (x-forwarded-proto) pro backend decidir
      // se o cookie de sessão pode ser Secure
      xfwd: true,
    },
  }

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), seoPlugin()],
    server: {
      // Necessário pro Vite aceitar requisições que chegam com um Host
      // diferente de localhost — é o caso do Cloudflare Tunnel, que expõe
      // o dev server num domínio próprio (vite.juk.re).
      allowedHosts: ['vite.juk.re'],
      proxy: apiProxy,
    },
    preview: { proxy: apiProxy },
  }
})
