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
  const primaryAccess = input.primaryKind === 'api' ? (input.primaryAccess || 'public') : ''
  const keyReq = input.primaryKind === 'api' ? (input.keyRequestUrl || '') : ''
  const secondaryLines = [...(input.secondary ?? [])]
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '') || a.url.localeCompare(b.url))
    .map((s) => [
      `kind=${s.kind || ''}`,
      `url=${s.url || ''}`,
      `access=${s.access || ''}`,
      `keyRequestUrl=${s.keyRequestUrl || ''}`,
      `displayName=${s.displayName || ''}`,
      `notes=${s.notes || ''}`,
    ].join('|'))
    .join('\n')
  const tagsJoined = [...(input.tagSlugs ?? [])].sort().join('\n')

  const parts: string[] = []
  parts.push('v2')
  parts.push('Agent')
  parts.push(`slug: ${input.slug || ''}`)
  parts.push(`name: ${input.name || ''}`)
  parts.push(`summary: ${input.summary || ''}`)
  parts.push(`thumbnailUrl: ${input.thumbnailUrl || ''}`)
  parts.push(`websiteUrl: ${input.websiteUrl || ''}`)
  parts.push('')
  parts.push('Primary')
  parts.push(`kind: ${input.primaryKind || ''}`)
  parts.push(`url: ${input.primaryUrl || ''}`)
  parts.push(`access: ${primaryAccess}`)
  parts.push(`keyRequestUrl: ${keyReq}`)
  parts.push('')
  parts.push('Secondary')
  if (secondaryLines) parts.push(secondaryLines)
  parts.push('')
  parts.push('Tags')
  if (tagsJoined) parts.push(tagsJoined)
  parts.push('')
  parts.push('Security')
  parts.push(`ownerWallet: ${input.ownerWalletBase58 || ''}`)
  parts.push(`agentWallet: ${input.agentWallet || ''}`)
  parts.push(`donationWallet: ${input.donationWallet || ''}`)
  parts.push(`nonce: ${input.nonce || ''}`)
  parts.push(`ts: ${input.tsISO}`)

  return parts.join('\n')
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


