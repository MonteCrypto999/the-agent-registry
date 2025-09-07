import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AgentWithRelations, CreateAgentInput } from '../types'

export function createSupabase(): SupabaseClient {
	const url = import.meta.env.VITE_SUPABASE_URL as string
	const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string
	if (!url || !anon) throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
	return createClient(url, anon)
}

export async function supabaseListAgents(supabase: SupabaseClient): Promise<AgentWithRelations[]> {
	const { data: agents, error } = await supabase
		.from('agents')
		.select('id, slug, name, summary, thumbnail_url, website_url, socials, owner_wallet, status, donation_wallet, created_at')
		.eq('status', 'published')
		.limit(100)
	if (error) throw error
	console.log('[Supabase] agents:', agents)
	const ids = (agents ?? []).map((a: any) => a.id)
	if (ids.length === 0) return [] as any
	const { data: interfaces, error: e2 } = await supabase
		.from('agent_interfaces')
		.select('id, agent_id, kind, url, access_policy, key_request_url, is_primary, display_name, notes')
		.in('agent_id', ids)
	if (e2) throw e2
	console.log('[Supabase] interfaces:', interfaces)
	const { data: tagRows, error: e3 } = await supabase
		.from('agent_tags')
		.select('agent_id, tags(id, slug, label, category)')
		.in('agent_id', ids)
	if (e3) throw e3
	console.log('[Supabase] tagRows:', tagRows)
	return (agents ?? []).map((a: any) => {
		const its = (interfaces ?? []).filter((i: any) => i.agent_id === a.id).map((i: any) => ({
			id: i.id, agentId: i.agent_id, kind: i.kind, url: i.url, accessPolicy: i.access_policy, keyRequestUrl: i.key_request_url, isPrimary: i.is_primary, displayName: i.display_name, notes: i.notes,
		}))
		const tgs = (tagRows ?? []).filter((t: any) => t.agent_id === a.id).map((t: any) => ({ id: t.tags.id, slug: t.tags.slug, label: t.tags.label, category: t.tags.category }))
		return { id: a.id, slug: a.slug, name: a.name, summary: a.summary, thumbnailUrl: a.thumbnail_url, websiteUrl: a.website_url, socials: a.socials, ownerWallet: a.owner_wallet, status: a.status, donationWallet: a.donation_wallet, createdAt: a.created_at, interfaces: its, tags: tgs }
	}) as any
}

export async function supabaseGetAgentById(supabase: SupabaseClient, id: string): Promise<AgentWithRelations | null> {
    const { data: agents, error } = await supabase
        .from('agents')
        .select('id, slug, name, summary, thumbnail_url, website_url, socials, owner_wallet, status, donation_wallet, created_at')
        .eq('id', id)
        .limit(1)
    if (error) throw error
    if (!agents || agents.length === 0) return null
    const a = agents[0] as any
    const { data: interfaces, error: e2 } = await supabase
        .from('agent_interfaces')
        .select('id, agent_id, kind, url, access_policy, key_request_url, is_primary, display_name, notes')
        .eq('agent_id', id)
    if (e2) throw e2
    const { data: tagRows, error: e3 } = await supabase
        .from('agent_tags')
        .select('tags(id, slug, label, category)')
        .eq('agent_id', id)
    if (e3) throw e3
    const its = (interfaces ?? []).map((i: any) => ({
        id: i.id, agentId: i.agent_id, kind: i.kind, url: i.url, accessPolicy: i.access_policy, keyRequestUrl: i.key_request_url, isPrimary: i.is_primary, displayName: i.display_name, notes: i.notes,
    }))
    const tgs = (tagRows ?? []).map((t: any) => ({ id: t.tags.id, slug: t.tags.slug, label: t.tags.label, category: t.tags.category }))
    return { id: a.id, slug: a.slug, name: a.name, summary: a.summary, thumbnailUrl: a.thumbnail_url, websiteUrl: a.website_url, socials: a.socials, ownerWallet: a.owner_wallet, status: a.status, donationWallet: a.donation_wallet, createdAt: a.created_at, interfaces: its, tags: tgs } as any
}

export async function supabaseCreateAgent(supabase: SupabaseClient, input: CreateAgentInput): Promise<{ id: string; slug: string }> {
    // Ensure unique slug by appending -2, -3, ... if needed
    let base = input.slug
    let candidate = base
    let n = 1
    while (true) {
        const { data, error } = await supabase.from('agents').select('id').eq('slug', candidate).limit(1)
        if (error) throw error
        if (!data || data.length === 0) break
        n += 1
        candidate = `${base}-${n}`
    }

    const { data: inserted, error: eIns } = await supabase
        .from('agents')
        .insert({
            slug: candidate,
            name: input.name,
            summary: input.summary,
            thumbnail_url: input.thumbnailUrl ?? null,
            website_url: input.websiteUrl ?? null,
            socials: input.socials ?? {},
            owner_wallet: input.ownerWallet,
            status: input.status ?? 'published',
            donation_wallet: input.donationWallet ?? null,
        })
        .select('id, slug')
        .single()
    if (eIns) throw eIns
    const id = (inserted as any).id as string
    const slug = (inserted as any).slug as string

    // Primary interface
    const pri = input.primaryInterface
    const { error: ePri } = await supabase
        .from('agent_interfaces')
        .insert({
            agent_id: id,
            kind: pri.kind,
            url: pri.url,
            access_policy: pri.accessPolicy ?? null,
            key_request_url: pri.keyRequestUrl ?? null,
            is_primary: true,
        })
    if (ePri) throw ePri

    // Secondary interfaces
    if (input.secondaryInterfaces && input.secondaryInterfaces.length) {
        const rows = input.secondaryInterfaces.map((s) => ({
            agent_id: id,
            kind: s.kind,
            url: s.url,
            access_policy: s.accessPolicy ?? null,
            key_request_url: s.keyRequestUrl ?? null,
            is_primary: false,
            display_name: s.displayName ?? null,
            notes: s.notes ?? null,
        }))
        const { error: eSec } = await supabase.from('agent_interfaces').insert(rows)
        if (eSec) throw eSec
    }

    // Tags by slug
    if (input.tagSlugs && input.tagSlugs.length) {
        const { data: tagRows, error: eTags } = await supabase.from('tags').select('id, slug').in('slug', input.tagSlugs)
        if (eTags) throw eTags
        if (tagRows && tagRows.length) {
            const links = tagRows.map((t: any) => ({ agent_id: id, tag_id: t.id }))
            const { error: eLink } = await supabase.from('agent_tags').insert(links)
            if (eLink) throw eLink
        }
    }

    return { id, slug }
}


