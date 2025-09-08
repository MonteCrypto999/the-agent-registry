import { describe, it, expect } from 'vitest'
import { buildAgentCreateMessage, __test__buildMessageFields } from './signing'

describe('signing', () => {
  it('builds human-readable v2 message', () => {
    const msg = buildAgentCreateMessage({
      slug: 'my-agent',
      name: 'Name',
      summary: 'Summary',
      thumbnailUrl: 'https://img',
      websiteUrl: 'https://site',
      primaryKind: 'web_ui',
      primaryUrl: 'https://entry',
      primaryAccess: null,
      keyRequestUrl: '',
      secondary: [],
      tagSlugs: ['alpha', 'beta'],
      ownerWalletBase58: 'Owner11111111111111111111111111111111111111111',
      agentWallet: 'Agent11111111111111111111111111111111111111111',
      donationWallet: '',
      nonce: 'nonce-1',
      tsISO: '2025-01-01T00:00:00Z',
    })
    const parts = __test__buildMessageFields({
      slug: 'my-agent',
      name: 'Name',
      summary: 'Summary',
      thumbnailUrl: 'https://img',
      websiteUrl: 'https://site',
      primaryKind: 'web_ui',
      primaryUrl: 'https://entry',
      primaryAccess: null,
      keyRequestUrl: '',
      secondary: [],
      tagSlugs: ['alpha', 'beta'],
      ownerWalletBase58: 'Owner11111111111111111111111111111111111111111',
      agentWallet: 'Agent11111111111111111111111111111111111111111',
      donationWallet: '',
      nonce: 'nonce-1',
      tsISO: '2025-01-01T00:00:00Z',
    })
    expect(parts[0]).toBe('v2')
    expect(parts[1]).toBe('Agent')
    expect(parts[2]).toBe('slug: my-agent')
    expect(parts[3]).toBe('name: Name')
    expect(msg).toContain('ownerWallet:')
    expect(msg).toContain('agentWallet:')
    expect(msg).toContain('ts: 2025-01-01T00:00:00Z')
  })
})


