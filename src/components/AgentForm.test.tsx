import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AgentForm from './AgentForm'

describe('AgentForm', () => {
  it('submits basic website agent', async () => {
    const onSubmit = vi.fn()
    render(<AgentForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'My Agent' } })
    fireEvent.change(screen.getByLabelText(/Summary/i), { target: { value: 'Desc' } })
    fireEvent.change(screen.getByLabelText(/Primary URL/i), { target: { value: 'https://example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    expect(onSubmit).toHaveBeenCalled()
  })
})


