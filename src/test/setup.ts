import '@testing-library/jest-dom'

// Silence React 19 act() warnings in tests if necessary
// (keep lean; can extend later)

// Force local data mode in tests and disable Supabase auto-detection
try {
  ;(import.meta as any).env = (import.meta as any).env || {}
  ;(import.meta as any).env.VITE_DATA_MODE = 'local'
  ;(import.meta as any).env.VITE_SUPABASE_URL = ''
  ;(import.meta as any).env.VITE_SUPABASE_ANON_KEY = ''
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    window.history.replaceState({}, '', '/?mode=local')
  }
} catch {}


