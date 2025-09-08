import type { InterfaceKind, AccessPolicy } from '../types'

export type SecondaryInput = {
  kind: InterfaceKind
  url: string
  access?: AccessPolicy | ''
  keyRequestUrl?: string
  displayName?: string
  notes?: string
}

export function buildAgentCreateMessage(input: {
  slug: string
  name: string
  summary: string
  thumbnailUrl?: string | null
  websiteUrl?: string | null
  primaryKind: InterfaceKind
  primaryUrl: string
  primaryAccess?: AccessPolicy | null
  keyRequestUrl?: string | null
  secondary: SecondaryInput[]
  tagSlugs: string[]
  ownerWalletBase58: string
  agentWallet: string
  donationWallet?: string | null
  nonce: string
  tsISO: string
}): string {
  const enc = (s: string) => toBase64(new TextEncoder().encode(s))
  const secondaryLines = [...(input.secondary ?? [])]
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '') || a.url.localeCompare(b.url))
    .map((s) => [
      enc(s.kind || ''),
      enc(s.url || ''),
      enc(s.access || ''),
      enc(s.keyRequestUrl || ''),
      enc(s.displayName || ''),
      enc(s.notes || ''),
    ].join('|'))
    .join('\n')

  const tagsJoined = [...(input.tagSlugs ?? [])].sort().map((t) => enc(t)).join('\n')
  const primaryAccess = input.primaryKind === 'api' ? (input.primaryAccess || 'public') : ''
  const keyReq = input.primaryKind === 'api' ? (input.keyRequestUrl || '') : ''

  return [
    'v1',
    enc(input.slug || ''),
    enc(input.name || ''),
    enc(input.summary || ''),
    enc(input.thumbnailUrl || ''),
    enc(input.websiteUrl || ''),
    enc(input.primaryKind || ''),
    enc(input.primaryUrl || ''),
    enc(primaryAccess),
    enc(keyReq),
    secondaryLines,
    tagsJoined,
    enc(input.ownerWalletBase58 || ''),
    enc(input.agentWallet || ''),
    enc(input.donationWallet || ''),
    enc(input.nonce || ''),
    enc(input.tsISO),
  ].join('\n')
}

export function toBase64(bytes: Uint8Array): string {
  // Browser-safe base64
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// Small helper for tests
export function __test__buildMessageFields(input: Parameters<typeof buildAgentCreateMessage>[0]): string[] {
  const msg = buildAgentCreateMessage(input)
  return msg.split('\n')
}


