import { createContext, useContext, useMemo } from 'react'
import type { AgentWithRelations, CreateAgentInput, UpdateAgentInput } from '../types'
import { listAgentsWithRelations, createAgent, updateAgentBySlug, getAgentById as getAgentByIdLocal, updateAgentById } from '../db/pglite'
import { createSupabase, supabaseListAgents, supabaseCreateAgent, supabaseGetAgentById, supabaseCreateAgentSigned } from './SupabaseProvider'
import { AGENTS } from '../seed'

interface DataContextValue {
	listAgents(): Promise<AgentWithRelations[]>
	createAgent(input: CreateAgentInput): Promise<{ id: string; slug: string }>
	createAgentSigned?(input: CreateAgentInput & { ownerWalletBase58: string; pubkeyBytes: Uint8Array; signatureBytes: Uint8Array; nonce: string; tsISO: string }): Promise<{ id: string; slug: string }>
	updateAgentBySlug: typeof updateAgentBySlug
    getAgentById(id: string): Promise<AgentWithRelations | null>
    updateAgentById: typeof updateAgentById
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
	const value = useMemo<DataContextValue>(() => {
		const mode = (import.meta.env.VITE_DATA_MODE as string | undefined)?.toLowerCase()
		// Allow URL override: ?mode=online|seed|local
		let urlMode: string | null = null
		try {
			urlMode = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('mode') : null
		} catch {}
		const supaReady = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
		const forced = (urlMode ?? mode)?.toLowerCase()
		const selectedMode = forced === 'online' || (!forced && supaReady) ? 'online' : (forced === 'seed' ? 'seed' : 'local')
		console.log('[DataProvider]', { mode, urlMode, supaReady, selectedMode, VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL })

		if (selectedMode === 'online') {
			const supabase = createSupabase()
			return {
				async listAgents() {
					return supabaseListAgents(supabase)
				},
				async createAgent(_input: CreateAgentInput) {
					// Fallback: old direct insert (kept for backward compatibility)
					return supabaseCreateAgent(supabase, _input)
				},
				// Signed variant exposed via context (optional usage from pages)
				async createAgentSigned(params: Parameters<typeof supabaseCreateAgentSigned>[1]) {
					return supabaseCreateAgentSigned(supabase, params)
				},
				async updateAgentBySlug(_slug: string, _input: UpdateAgentInput) {
					throw new Error('Online mode: updateAgentBySlug not implemented')
				},
				async getAgentById(_id: string) {
					const res = await supabaseGetAgentById(supabase, _id)
					return res
				},
				async updateAgentById(_id: string, _input: UpdateAgentInput) {
					throw new Error('Online mode: updateAgentById not implemented')
				},
			}
		}

		if (selectedMode === 'seed') {
			return {
				async listAgents() {
					return AGENTS as unknown as AgentWithRelations[]
				},
				async createAgent(_input: CreateAgentInput) {
					throw new Error('Seed mode: createAgent not supported')
				},
				async createAgentSigned() {
					throw new Error('Seed mode: createAgentSigned not supported')
				},
				async updateAgentBySlug(_slug: string, _input: UpdateAgentInput) {
					throw new Error('Seed mode: updateAgentBySlug not supported')
				},
				async getAgentById(id: string) {
					const found = (AGENTS as unknown as AgentWithRelations[]).find(a => a.id === id) ?? null
					return found
				},
				async updateAgentById(_id: string, _input: UpdateAgentInput) {
					throw new Error('Seed mode: updateAgentById not supported')
				},
			}
		}

		// Local default
		return {
			async listAgents() {
				return listAgentsWithRelations()
			},
			createAgent,
			async createAgentSigned() {
				throw new Error('Local mode: createAgentSigned not supported')
			},
			updateAgentBySlug,
			async getAgentById(id: string) {
				return (await getAgentByIdLocal(id)) as unknown as AgentWithRelations | null
			},
			updateAgentById,
		}
	}, [])

	return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
	const ctx = useContext(DataContext)
	if (!ctx) throw new Error('useData must be used within DataProvider')
	return ctx
}

export function useOptionalData() {
    return useContext(DataContext)
}


