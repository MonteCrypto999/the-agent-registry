import { describe, it, expect } from 'vitest'
import { createAgent, listAgentsWithRelations, updateAgentById } from './pglite'

describe('DB mutations', () => {
  it('creates a new website agent', async () => {
    const result = await createAgent({
      slug: 'new-agent',
      name: 'New Agent',
      summary: 'Test',
      ownerWallet: 'Wallet111111111111111111111111111111111111',
      primaryInterface: { kind: 'web_ui', url: 'https://example.com' },
    })
    expect(result.id).toBeTypeOf('string')
    expect(result.slug).toBe('new-agent')
    const agents = await listAgentsWithRelations()
    expect(agents.some(a => a.slug === 'new-agent')).toBe(true)
  })

  it('updates agent name by id', async () => {
    const result = await createAgent({
      slug: 'upd-agent',
      name: 'Old Name',
      summary: 'Test',
      ownerWallet: 'Wallet444',
      primaryInterface: { kind: 'web_ui', url: 'https://example.com' },
    })
    await updateAgentById(result.id, { name: 'New Name' })
    const agents = await listAgentsWithRelations()
    expect(agents.find(a => a.id === result.id)?.name).toBe('New Name')
  })

  it('ensures unique slug by suffixing', async () => {
    const r1 = await createAgent({
      slug: 'dup-agent',
      name: 'Dup Agent',
      summary: 'Test',
      ownerWallet: 'Wallet222',
      primaryInterface: { kind: 'web_ui', url: 'https://example.com' },
    })
    const r2 = await createAgent({
      slug: 'dup-agent',
      name: 'Dup Agent 2',
      summary: 'Test2',
      ownerWallet: 'Wallet333',
      primaryInterface: { kind: 'web_ui', url: 'https://example.com/2' },
    })
    expect(r1.slug).toBe('dup-agent')
    expect(r2.slug).toMatch(/^dup-agent-\d+$/)
  })
})


