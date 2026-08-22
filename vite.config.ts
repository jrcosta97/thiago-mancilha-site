import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig(({ mode }) => {
  // Carrega .env manualmente (com VITE_ prefix, como o Vite carregaria no browser)
  const env = loadEnv(mode, process.cwd(), '')

  // 🔴 URL de fallback alinhada ao projeto linkado no Supabase CLI
  // Correta: https://tkduufvpbqjsqjrhimry.supabase.co
  const HARDCODED_SUPABASE_URL = 'https://tkduufvpbqjsqjrhimry.supabase.co'

  const SB_URL: string =
    (env.VITE_SUPABASE_URL && String(env.VITE_SUPABASE_URL).trim()) ||
    HARDCODED_SUPABASE_URL

  // Avisa no terminal se caiu no fallback, para debugar
  if (mode === 'development') {
    console.log('\n%s 🛰️ [vite.config.ts] Proxy Supabase target: %s\n',
      new Date().toLocaleTimeString('pt-BR'),
      SB_URL
    )
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      // ⚠️ REMOVIDO proxy /__sb completamente.
      // O Vite 5 + http-proxy-middleware crasha (HTTP 500) nesta máquina específica.
      // O Supabase é chamado DIRETAMENTE via URL real (tkduufvpbqjsqjrhimry.supabase.co),
      // e a configuração de CORS é feita no painel Supabase (Authentication → URLs) + SQL allowed origins.
    },
  }
})
