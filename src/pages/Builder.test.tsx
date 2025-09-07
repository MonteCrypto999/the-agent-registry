import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SolanaWalletProvider } from '../wallet/WalletProvider'
import { DataProvider } from '../providers/DataProvider'
import Builder from './Builder'

describe('Builder page', () => {
  it('shows disconnected state by default', () => {
    render(
      <SolanaWalletProvider>
        <DataProvider>
          <Builder />
        </DataProvider>
      </SolanaWalletProvider>
    )
    expect(screen.getByTestId('builder-disconnected')).toBeInTheDocument()
  })
})


