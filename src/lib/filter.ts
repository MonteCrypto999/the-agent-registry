import type { AgentWithRelations, InterfaceKind } from '../types'

export type InterfaceFilter = 'any' | InterfaceKind
export type AccessFilter = 'any' | 'public' | 'key_required'

export interface FilterOptions {
	query?: string
	tagSlugs?: string[]
	interfaceKind?: InterfaceFilter
	access?: AccessFilter
}

export function filterAgents(agents: AgentWithRelations[], opts: FilterOptions): AgentWithRelations[] {
	const query = (opts.query ?? '').trim().toLowerCase()
	const rawTags = (opts.tagSlugs ?? []).map((t) => t.toLowerCase())
	const tagSet = new Set(rawTags)
	const interfaceKind = opts.interfaceKind ?? 'any'
	const access = opts.access ?? 'any'

	// Special pseudo-tags that affect filters but aren't stored on agent.tags
	const wantsPublicApi = tagSet.has('public-api')
	const wantsApiKey = tagSet.has('api-key')
	if (wantsPublicApi) tagSet.delete('public-api')
	if (wantsApiKey) tagSet.delete('api-key')

	return agents.filter((agent) => {
		// text query on name and summary
		if (query) {
			const hay = `${agent.name}\n${agent.summary}`.toLowerCase()
			if (!hay.includes(query)) return false
		}

		// tags (require all selected tags)
		if (tagSet.size > 0) {
			const agentTagSlugs = new Set(agent.tags.map((t) => t.slug.toLowerCase()))
			for (const slug of tagSet) {
				if (!agentTagSlugs.has(slug)) return false
			}
		}

		// interface kind and access
		const primary = agent.interfaces.find((i) => i.isPrimary)
		if (interfaceKind !== 'any') {
			if (!primary || primary.kind !== interfaceKind) return false
		}
		if (access !== 'any') {
			if (!primary || primary.kind !== 'api') return false
			if (primary.accessPolicy !== access) return false
		}

		// Special pseudo-tags
		if (wantsPublicApi) {
			if (!primary || primary.kind !== 'api' || primary.accessPolicy !== 'public') return false
		}
		if (wantsApiKey) {
			if (!primary || primary.kind !== 'api' || primary.accessPolicy !== 'key_required') return false
		}

		return true
	})
}


