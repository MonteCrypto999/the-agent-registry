import { useWallet } from '@solana/wallet-adapter-react'
import AgentForm, { type AgentFormValues } from '../components/AgentForm'
import { useData } from '../providers/DataProvider'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { buildAgentCreateMessage, toBase64 } from '../lib/signing'
import { TAGS } from '../seed'
import { getTagClasses } from '../lib/tagStyles'

const MAX_TAGS = 4

export default function AgentNew() {
	const { publicKey, connected } = useWallet()
	const { createAgent, createAgentSigned } = useData() as any
	const navigate = useNavigate()
	const [tagSlugs, setTagSlugs] = useState<string[]>([])
	const [error, setError] = useState<string | null>(null)
	const [submitting, setSubmitting] = useState(false)
	const canAddMore = tagSlugs.length < MAX_TAGS
	const helper = useMemo(() => `${tagSlugs.length}/${MAX_TAGS} tags selected`, [tagSlugs.length])

	function toggle(slug: string) {
		setTagSlugs((prev) => {
			const s = new Set(prev)
			if (s.has(slug)) s.delete(slug)
			else if (prev.length < MAX_TAGS) s.add(slug)
			return [...s]
		})
	}

	async function handleSubmit(v: AgentFormValues) {
		if (!connected || !publicKey) return
		setError(null)
		setSubmitting(true)
		try {
			// Build canonical message and sign with wallet
			const nonce = crypto.randomUUID()
			const tsISO = new Date().toISOString()
			const ownerWalletBase58 = publicKey.toBase58()
			const msg = buildAgentCreateMessage({
				slug: v.name,
				name: v.name,
				summary: v.summary,
				thumbnailUrl: v.thumbnailUrl || '',
				websiteUrl: v.websiteUrl || '',
				primaryKind: v.primaryKind,
				primaryUrl: v.primaryUrl,
				primaryAccess: v.primaryKind === 'api' ? (v.primaryAccess ?? 'public') : null,
				keyRequestUrl: v.primaryKind === 'api' ? (v.keyRequestUrl || '') : '',
				secondary: (v.secondary ?? []).map((s) => ({
					kind: s.kind,
					url: s.url,
					access: (s.access ?? '') as any,
					keyRequestUrl: s.keyRequestUrl || '',
					displayName: s.displayName || '',
					notes: s.notes || '',
				})),
				tagSlugs,
				ownerWalletBase58,
				agentWallet: v.agentWallet!,
				donationWallet: v.donationWallet || '',
				nonce,
				tsISO,
			})
			// @ts-ignore signMessage present when wallet supports it
			const signatureBytes: Uint8Array = await (window as any).solana?.signMessage ? (await (window as any).solana.signMessage(new TextEncoder().encode(msg), 'utf8')).signature : await (async () => { throw new Error('Wallet does not support message signing') })()
			const pubkeyBytes = publicKey.toBytes()
			const result = await (createAgentSigned ? createAgentSigned({
				slug: v.name,
				name: v.name,
				summary: v.summary,
				thumbnailUrl: v.thumbnailUrl || undefined,
				websiteUrl: v.websiteUrl || undefined,
				ownerWallet: ownerWalletBase58,
				primaryInterface: {
					kind: v.primaryKind,
					url: v.primaryUrl,
					accessPolicy: v.primaryKind === 'api' ? (v.primaryAccess ?? 'public') : null,
					keyRequestUrl: v.primaryKind === 'api' ? (v.keyRequestUrl || null) : null,
				},
				secondaryInterfaces: (v.secondary ?? []).map((s) => ({
					kind: s.kind,
					url: s.url,
					accessPolicy: s.access ?? null,
					keyRequestUrl: s.keyRequestUrl || null,
					displayName: s.displayName || null,
					notes: s.notes || null,
				})),
				tagSlugs,
				donationWallet: v.donationWallet || null,
				ownerWalletBase58,
				agentWallet: v.agentWallet!,
				pubkeyBytes,
				signatureBytes,
				nonce,
				tsISO,
			}) : createAgent({
				slug: v.name,
				name: v.name,
				summary: v.summary,
				thumbnailUrl: v.thumbnailUrl || undefined,
				websiteUrl: v.websiteUrl || undefined,
				ownerWallet: ownerWalletBase58,
				agentWallet: v.agentWallet!,
				primaryInterface: {
					kind: v.primaryKind,
					url: v.primaryUrl,
					accessPolicy: v.primaryKind === 'api' ? (v.primaryAccess ?? 'public') : null,
					keyRequestUrl: v.primaryKind === 'api' ? (v.keyRequestUrl || null) : null,
				},
				secondaryInterfaces: (v.secondary ?? []).map((s) => ({
					kind: s.kind,
					url: s.url,
					accessPolicy: s.access ?? null,
					keyRequestUrl: s.keyRequestUrl || null,
					displayName: s.displayName || null,
					notes: s.notes || null,
				})),
				tagSlugs,
				donationWallet: v.donationWallet || null,
			}) )
			navigate(`/agent/${result.id}`)
		} catch (e: any) {
			setError(e?.message ?? 'Failed to create agent')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div>
			<h1 className="text-2xl font-semibold">Create agent</h1>
			{!connected && <p className="mt-2 text-sm text-[var(--color-muted)]">Connect your wallet to create an agent.</p>}
			{connected && (
				<div className="mt-4 space-y-4">
					<div>
						<div className="mb-1 flex items-center justify-between">
							<span className="text-sm font-medium text-black/80">Tags</span>
							<span className="text-xs text-black/50">{helper}</span>
						</div>
						{error && <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
						<div className="flex flex-wrap gap-2">
							{TAGS.map((t) => {
								const active = tagSlugs.includes(t.slug)
								const disabled = !active && !canAddMore
								return (
									<button key={t.id} type="button" disabled={disabled || submitting} onClick={() => toggle(t.slug)} className={`${getTagClasses(t.slug, { active, category: (t as any).category ?? null })} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
										{t.label}
									</button>
								)
							})}
						</div>
					</div>
					<AgentForm onSubmit={handleSubmit} />
				</div>
			)}
		</div>
	)
}


