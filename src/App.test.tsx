import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import { DataProvider } from './providers/DataProvider'

describe('Routing', () => {
  it('renders Home page heading', async () => {
    const router = createBrowserRouter([
      { path: '/', element: <Home /> },
    ])
    render(
      <DataProvider>
        <RouterProvider router={router} />
      </DataProvider>
    )
    expect(await screen.findByRole('heading', { name: /Agents/i })).toBeInTheDocument()
  })
})


