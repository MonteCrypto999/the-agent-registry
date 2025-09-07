import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import AgentDetail from './AgentDetail'
import { DataProvider } from '../providers/DataProvider'

describe('AgentDetail page', () => {
  it('shows agent info for seeded id and renders socials when present', async () => {
    const router = createMemoryRouter([
      { path: '/agent/:id', element: <AgentDetail /> },
    ], { initialEntries: ['/agent/8d0f6e2e-6f5c-4b40-9f3a-b0c1b59e3d01'] })
    render(
      <DataProvider>
        <RouterProvider router={router} />
      </DataProvider>
    )
    expect(await screen.findByRole('heading', { name: /Starter Agent/i })).toBeInTheDocument()
    // Socials: we render link labels capitalized (e.g., X)
    expect(await screen.findByText(/x/i)).toBeInTheDocument()
  })
})


