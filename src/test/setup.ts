import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

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


// Mock Solana wallet adapters to avoid context errors in tests
vi.mock('@solana/wallet-adapter-react', async () => {
  return {
    useWallet: () => ({ publicKey: null, connected: false, sendTransaction: vi.fn() }),
    useConnection: () => ({ connection: {} as any }),
    ConnectionProvider: ({ children }: any) => children,
    WalletProvider: ({ children }: any) => children,
  }
})

vi.mock('@solana/wallet-adapter-react-ui', async () => {
  return {
    useWalletModal: () => ({ visible: false, setVisible: (_v: boolean) => {} }),
    WalletModalProvider: ({ children }: any) => children,
    WalletMultiButton: (props: any) => React.createElement('button', { ...props }, props?.children ?? 'Connect Wallet'),
  }
})

// Silence specific noisy warnings in test output
const originalWarn = console.warn
const originalError = console.error
console.warn = (...args: any[]) => {
  const msg = String(args[0] ?? '')
  if (msg.includes('Lit is in dev mode')) return
  if (msg.includes('punycode') && msg.includes('deprecated')) return
  originalWarn(...args)
}
console.error = (...args: any[]) => {
  const msg = String(args[0] ?? '')
  if (msg.includes('Lit is in dev mode')) return
  if (msg.includes('punycode') && msg.includes('deprecated')) return
  originalError(...args)
}


