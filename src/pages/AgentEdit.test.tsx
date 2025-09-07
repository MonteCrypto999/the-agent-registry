import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import AgentEdit from './AgentEdit'
import { DataProvider } from '../providers/DataProvider'

describe('AgentEdit page', () => {
  it('prefills form with existing agent data', async () => {
    const router = createMemoryRouter([
      { path: '/agent/:id/edit', element: <AgentEdit /> },
    ], { initialEntries: ['/agent/8d0f6e2e-6f5c-4b40-9f3a-b0c1b59e3d01/edit'] })
    render(
      <DataProvider>
        <RouterProvider router={router} />
      </DataProvider>
    )
    expect(await screen.findByRole('heading', { name: /Edit agent/i })).toBeInTheDocument()
    // Starter Agent from seed
    expect(await screen.findByDisplayValue(/Starter Agent/i)).toBeInTheDocument()
  })
})


