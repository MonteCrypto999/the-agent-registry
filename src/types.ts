export type AccessPolicy = 'public' | 'key_required'
export type InterfaceKind = 'api' | 'web_ui'

export type SocialKeys = 'x' | 'telegram' | 'discord' | 'youtube' | 'github' | 'farcaster'

export interface AgentInterface {
	id: string
	agentId: string
	kind: InterfaceKind
	url: string
	accessPolicy: AccessPolicy | null
	keyRequestUrl?: string | null
	isPrimary: boolean
	displayName?: string | null
	notes?: string | null
}

export interface Agent {
	id: string
	slug: string
	name: string
	summary: string
	thumbnailUrl?: string | null
	websiteUrl?: string | null
	socials?: Partial<Record<SocialKeys | string, string>>
	ownerWallet: string
	agentWallet?: string | null
	status: 'draft' | 'published' | 'archived'
	links?: Record<string, string>
	extras?: Record<string, unknown>
	createdAt: string
	donationWallet?: string | null
}

export interface Tag {
	id: string
	slug: string
	label: string
	category?: string | null
}

export interface AgentTag {
	agentId: string
	tagId: string
}

export interface BuilderProfile {
	wallet: string
	username?: string | null
	bio?: string | null
	avatarUrl?: string | null
	extras?: Record<string, unknown>
}

export interface AgentWithRelations extends Agent {
	interfaces: AgentInterface[]
	tags: Tag[]
}

export interface CreateAgentInput {
  slug: string
  name: string
  summary: string
  thumbnailUrl?: string | null
  websiteUrl?: string | null
  socials?: Partial<Record<SocialKeys | string, string>>
  ownerWallet: string
  agentWallet: string
  status?: 'draft' | 'published' | 'archived'
  primaryInterface: {
    kind: InterfaceKind
    url: string
    accessPolicy?: AccessPolicy | null
    keyRequestUrl?: string | null
  }
  secondaryInterfaces?: Array<{
    kind: InterfaceKind
    url: string
    accessPolicy?: AccessPolicy | null
    keyRequestUrl?: string | null
    displayName?: string | null
    notes?: string | null
  }>
  tagSlugs?: string[]
  donationWallet?: string | null
}

export interface UpdateAgentInput {
  name?: string
  summary?: string
  thumbnailUrl?: string | null
  websiteUrl?: string | null
  socials?: Partial<Record<SocialKeys | string, string>>
  status?: 'draft' | 'published' | 'archived'
  primaryInterface?: {
    kind: InterfaceKind
    url: string
    accessPolicy?: AccessPolicy | null
    keyRequestUrl?: string | null
  }
  secondaryInterfaces?: Array<{
    kind: InterfaceKind
    url: string
    accessPolicy?: AccessPolicy | null
    keyRequestUrl?: string | null
    displayName?: string | null
    notes?: string | null
  }>
  tagSlugs?: string[]
  donationWallet?: string | null
}


