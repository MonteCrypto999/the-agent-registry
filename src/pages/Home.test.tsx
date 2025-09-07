import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import { DataProvider } from '../providers/DataProvider'

describe('Home page', () => {
  it('lists seeded agents', async () => {
    render(
      <DataProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </DataProvider>
    )
    expect(await screen.findByRole('heading', { name: /Agents/i })).toBeInTheDocument()
    expect(await screen.findByText(/Starter Agent/i)).toBeInTheDocument()
  })
})


