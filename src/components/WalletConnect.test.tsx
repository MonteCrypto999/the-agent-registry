import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SolanaWalletProvider } from '../wallet/WalletProvider'
import WalletConnect from './WalletConnect'

describe('WalletConnect', () => {
  it('renders wallet button', () => {
    render(
      <SolanaWalletProvider>
        <WalletConnect />
      </SolanaWalletProvider>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})


