import { describe, it, expect } from 'vitest'
import { buildAgentCreateMessage, __test__buildMessageFields } from './signing'

describe('signing', () => {
  it('builds canonical message with base64-encoded fields', () => {
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
    expect(parts[0]).toBe('v1')
    // fields 1..9 base64; check one example
    expect(parts[1]).toMatch(/^[A-Za-z0-9+/=]+$/)
    // tag lines base64
    expect(parts[11]).toMatch(/^[A-Za-z0-9+/=]+$/)
    // wallets base64 as well
    expect(parts[13]).toMatch(/^[A-Za-z0-9+/=]+$/)
    expect(parts[14]).toMatch(/^[A-Za-z0-9+/=]+$/)
    // entire message is non-empty
    expect(msg.length).toBeGreaterThan(10)
  })
})


