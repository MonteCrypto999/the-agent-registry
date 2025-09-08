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
  donationWallet?: string | null
  nonce: string
  tsISO: string
}): string {
  const secondaryLines = [...(input.secondary ?? [])]
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '') || a.url.localeCompare(b.url))
    .map((s) => [
      s.kind || '',
      s.url || '',
      s.access || '',
      s.keyRequestUrl || '',
      s.displayName || '',
      s.notes || '',
    ].join('|'))
    .join('\n')

  const tagsJoined = [...(input.tagSlugs ?? [])].sort().join('\n')
  const primaryAccess = input.primaryKind === 'api' ? (input.primaryAccess || 'public') : ''
  const keyReq = input.primaryKind === 'api' ? (input.keyRequestUrl || '') : ''

  return [
    'v1',
    input.slug || '',
    input.name || '',
    input.summary || '',
    input.thumbnailUrl || '',
    input.websiteUrl || '',
    input.primaryKind || '',
    input.primaryUrl || '',
    primaryAccess,
    keyReq,
    secondaryLines,
    tagsJoined,
    input.ownerWalletBase58 || '',
    input.donationWallet || '',
    input.nonce || '',
    input.tsISO,
  ].join('\n')
}

export function toBase64(bytes: Uint8Array): string {
  // Browser-safe base64
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}


