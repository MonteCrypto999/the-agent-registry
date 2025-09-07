import { describe, it, expect } from 'vitest'
import { filterAgents } from './filter'
import { AGENTS } from '../seed'

describe('filterAgents', () => {
  it('matches by text query', () => {
    const res = filterAgents(AGENTS, { query: 'starter' })
    expect(res.some(a => a.slug === 'starter-agent')).toBe(true)
  })

  it('filters by interface kind (web_ui)', () => {
    const res = filterAgents(AGENTS, { interfaceKind: 'web_ui' })
    expect(res.every(a => a.interfaces.find(i => i.isPrimary)?.kind === 'web_ui')).toBe(true)
  })
})


