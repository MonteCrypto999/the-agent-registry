import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  console.log('[Vite env]', {
    VITE_DATA_MODE: env.VITE_DATA_MODE,
    hasSupabaseUrl: Boolean(env.VITE_SUPABASE_URL),
    hasSupabaseAnon: Boolean(env.VITE_SUPABASE_ANON_KEY),
  })
  return {
    plugins: [tailwindcss(), react()],
    // Vitest configuration
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
      css: true,
    },
  }
})
