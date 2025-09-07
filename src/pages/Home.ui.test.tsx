import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import { DataProvider } from '../providers/DataProvider'

describe('Home UI filters', () => {
  it('filters by text', async () => {
    render(
      <DataProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </DataProvider>
    )
    expect(await screen.findByText(/Starter Agent/i)).toBeInTheDocument()
    const input = screen.getByPlaceholderText(/Search/i)
    fireEvent.change(input, { target: { value: 'notfound' } })
    expect(screen.queryByText(/Starter Agent/i)).toBeNull()
  })

  it('hydrates from URL query', async () => {
    render(
      <DataProvider>
        <MemoryRouter initialEntries={[{ pathname: '/', search: '?q=starter' }]}> 
          <Home />
        </MemoryRouter>
      </DataProvider>
    )
    expect(await screen.findByDisplayValue(/starter/i)).toBeInTheDocument()
  })
})


