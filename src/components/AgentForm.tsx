import { useState } from 'react'
import type { AccessPolicy, InterfaceKind } from '../types'

export interface AgentFormValues {
	name: string
	summary: string
	websiteUrl?: string
	thumbnailUrl?: string
	agentWallet?: string
	primaryKind: InterfaceKind
	primaryUrl: string
	primaryAccess?: AccessPolicy | null
	keyRequestUrl?: string
	donationWallet?: string
	secondary?: Array<{
		kind: InterfaceKind
		url: string
		access?: AccessPolicy | null
		keyRequestUrl?: string
		displayName?: string
		notes?: string
	}>
}

export default function AgentForm({ initial, onSubmit }: { initial?: Partial<AgentFormValues>, onSubmit: (v: AgentFormValues) => Promise<void> | void }) {
	const [values, setValues] = useState<AgentFormValues>({
		name: initial?.name ?? '',
		summary: initial?.summary ?? '',
		websiteUrl: initial?.websiteUrl ?? '',
		thumbnailUrl: initial?.thumbnailUrl ?? '',
		agentWallet: (initial as any)?.agentWallet ?? '',
		primaryKind: (initial?.primaryKind ?? 'web_ui') as InterfaceKind,
		primaryUrl: initial?.primaryUrl ?? '',
		primaryAccess: (initial?.primaryAccess ?? null) as AccessPolicy | null,
		keyRequestUrl: initial?.keyRequestUrl ?? '',
		donationWallet: initial?.donationWallet ?? '',
		secondary: initial?.secondary ?? [],
	})
	const [errors, setErrors] = useState<{
		name?: string
		summary?: string
		websiteUrl?: string
		thumbnailUrl?: string
		agentWallet?: string
		primaryUrl?: string
		keyRequestUrl?: string
		secondary?: Record<number, { url?: string; displayName?: string; keyRequestUrl?: string }>
	}>({})

	function set<K extends keyof AgentFormValues>(key: K, val: AgentFormValues[K]) {
		setValues((v) => ({ ...v, [key]: val }))
	}

	function addSecondary() {
		setValues((v) => ({ ...v, secondary: [...(v.secondary ?? []), { kind: 'api', url: '', access: null, keyRequestUrl: '', displayName: '', notes: '' }] }))
	}
	function updateSecondary(idx: number, patch: Partial<NonNullable<AgentFormValues['secondary']>[number]>) {
		setValues((v) => ({
			...v,
			secondary: (v.secondary ?? []).map((s, i) => i === idx ? { ...s, ...patch } : s),
		}))
	}
	function removeSecondary(idx: number) {
		setValues((v) => ({ ...v, secondary: (v.secondary ?? []).filter((_, i) => i !== idx) }))
	}

	function isValidUrl(u: string) {
		try {
			new URL(u)
			return true
		} catch {
			return false
		}
	}

	function validate(v: AgentFormValues) {
		const next: typeof errors = { secondary: {} }
		if (!v.name.trim()) next.name = 'Name is required'
		if (!v.summary.trim()) next.summary = 'Summary is required'
		if (!v.websiteUrl?.trim()) next.websiteUrl = 'Website URL is required'
		else if (!isValidUrl(v.websiteUrl)) next.websiteUrl = 'Website URL is invalid'
		if (!v.thumbnailUrl?.trim()) next.thumbnailUrl = 'Thumbnail URL is required'
		else if (!isValidUrl(v.thumbnailUrl)) next.thumbnailUrl = 'Thumbnail URL is invalid'
		if (!v.agentWallet?.trim()) next.agentWallet = 'Agent wallet is required'
		else if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v.agentWallet)) next.agentWallet = 'Agent wallet looks invalid'
		if (!v.primaryUrl.trim()) next.primaryUrl = 'Primary URL is required'
		else if (!isValidUrl(v.primaryUrl)) next.primaryUrl = 'Primary URL is invalid'
		if (v.primaryKind === 'api' && v.primaryAccess === 'key_required' && !v.keyRequestUrl?.trim()) {
			next.keyRequestUrl = 'Key request URL is required for key-required APIs'
		} else if (v.keyRequestUrl && v.keyRequestUrl.trim() && !isValidUrl(v.keyRequestUrl)) {
			next.keyRequestUrl = 'Key request URL is invalid'
		}
		(v.secondary ?? []).forEach((s, i) => {
			const se: { url?: string; displayName?: string; keyRequestUrl?: string } = {}
			if (!s.url?.trim()) se.url = 'URL is required'
			else if (!isValidUrl(s.url)) se.url = 'URL is invalid'
			if (!s.displayName?.trim()) se.displayName = 'Name is required'
			if (s.kind === 'api' && s.access === 'key_required' && !s.keyRequestUrl?.trim()) {
				se.keyRequestUrl = 'Key request URL required'
			} else if (s.keyRequestUrl && s.keyRequestUrl.trim() && !isValidUrl(s.keyRequestUrl)) {
				se.keyRequestUrl = 'Key request URL is invalid'
			}
			if (Object.keys(se).length) (next.secondary as any)[i] = se
		})
		if (Object.keys(next).some(k => k !== 'secondary' ? (next as any)[k] : Object.keys(next.secondary ?? {}).length > 0)) {
			return next
		}
		return {}
	}

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				const vErr = validate(values)
				setErrors(vErr)
				const hasErr = Boolean(
					vErr.name ||
					vErr.summary ||
					vErr.websiteUrl ||
					vErr.thumbnailUrl ||
					vErr.primaryUrl ||
					vErr.keyRequestUrl ||
					Object.keys(vErr.secondary ?? {}).length
				)
				if (hasErr) return
				await onSubmit(values)
			}}
			className="space-y-3"
		>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label className="block text-sm">
					<span className="mb-1 block text-black/80">Name <span className="text-red-600">*</span></span>
					<input value={values.name} onChange={(e) => set('name', e.target.value)} className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none" required />
					{errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name}</span>}
				</label>
				<label className="block text-sm sm:col-span-2">
					<span className="mb-1 block text-black/80">Summary <span className="text-red-600">*</span></span>
					<textarea value={values.summary} onChange={(e) => set('summary', e.target.value)} className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none" rows={3} required />
					{errors.summary && <span className="mt-1 block text-xs text-red-600">{errors.summary}</span>}
				</label>
				<label className="block text-sm">
					<span className="mb-1 block text-black/80">Website URL <span className="text-red-600">*</span></span>
					<input value={values.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none" required />
					{errors.websiteUrl && <span className="mt-1 block text-xs text-red-600">{errors.websiteUrl}</span>}
				</label>
				<label className="block text-sm">
					<span className="mb-1 block text-black/80">Thumbnail URL <span className="text-red-600">*</span></span>
					<input value={values.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)} className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none" required />
					{errors.thumbnailUrl && <span className="mt-1 block text-xs text-red-600">{errors.thumbnailUrl}</span>}
				</label>
				<label className="block text-sm sm:col-span-2">
					<span className="mb-1 block text-black/80">Agent wallet (on-chain ID) <span className="text-red-600">*</span></span>
					<input value={values.agentWallet} onChange={(e) => set('agentWallet', e.target.value)} placeholder="e.g. 6k7..." className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none" required />
					{errors.agentWallet && <span className="mt-1 block text-xs text-red-600">{errors.agentWallet}</span>}
					<span className="mt-1 block text-xs text-black/50">Used as the agent's on‑chain identifier.</span>
				</label>
				<label className="block text-sm sm:col-span-2">
					<span className="mb-1 block text-black/80">Donation wallet (Solana, optional)</span>
					<input value={values.donationWallet} onChange={(e) => set('donationWallet', e.target.value)} placeholder="e.g. 6k7..." className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none" />
					<span className="mt-1 block text-xs text-black/50">If provided, users can donate SOL directly to this address.</span>
				</label>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<label className="block text-sm">
					<span className="mb-1 block text-black/80">Primary interface <span className="text-red-600">*</span></span>
					<select value={values.primaryKind} onChange={(e) => set('primaryKind', e.target.value as InterfaceKind)} className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none">
						<option value="web_ui">Website</option>
						<option value="api">API</option>
					</select>
				</label>
				<label className="block text-sm sm:col-span-2">
					<span className="mb-1 block text-black/80">Primary URL <span className="text-red-600">*</span></span>
					<input value={values.primaryUrl} onChange={(e) => set('primaryUrl', e.target.value)} className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none" required />
					{errors.primaryUrl && <span className="mt-1 block text-xs text-red-600">{errors.primaryUrl}</span>}
					<span className="mt-1 block text-xs text-black/50">This is the agent message endpoint users contact first.</span>
				</label>
				{values.primaryKind === 'api' && (
					<>
						<label className="block text-sm">
							<span className="mb-1 block text-black/80">API access</span>
							<select value={values.primaryAccess ?? ''} onChange={(e) => set('primaryAccess', (e.target.value || null) as any)} className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none">
								<option value="public">Public</option>
								<option value="key_required">Key required</option>
							</select>
						</label>
						<label className="block text-sm sm:col-span-2">
							<span className="mb-1 block text-black/80">Key request URL (if any)</span>
							<input value={values.keyRequestUrl} onChange={(e) => set('keyRequestUrl', e.target.value)} className="w-full rounded border border-black/10 bg-white px-3 py-2 outline-none" />
							{errors.keyRequestUrl && <span className="mt-1 block text-xs text-red-600">{errors.keyRequestUrl}</span>}
						</label>
					</>
				)}
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium text-black/80">Secondary endpoints</h3>
					<button type="button" onClick={addSecondary} className="rounded bg-[var(--color-accent-600)] px-2 py-1 text-xs font-medium text-white hover:bg-[var(--color-accent-700)]">Add</button>
				</div>
				{(values.secondary ?? []).length === 0 && (
					<p className="text-xs text-black/50">Optional additional endpoints (e.g., Webhook, Admin API, Docs).</p>
				)}
				{(values.secondary ?? []).map((s, idx) => (
					<div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-6">
						<label className="block text-xs sm:col-span-1">
							<span className="mb-1 block text-black/70">Kind</span>
							<select value={s.kind} onChange={(e) => updateSecondary(idx, { kind: e.target.value as InterfaceKind })} className="w-full rounded border border-black/10 bg-white px-2 py-1 outline-none">
								<option value="api">API</option>
								<option value="web_ui">Website</option>
							</select>
						</label>
						<label className="block text-xs sm:col-span-2">
							<span className="mb-1 block text-black/70">URL</span>
							<input value={s.url} onChange={(e) => updateSecondary(idx, { url: e.target.value })} className="w-full rounded border border-black/10 bg-white px-2 py-1 outline-none" />
							{errors.secondary && errors.secondary[idx] && errors.secondary[idx].url && (<span className="mt-1 block text-[10px] text-red-600">{errors.secondary[idx].url}</span>)}
						</label>
						<label className="block text-xs sm:col-span-1">
							<span className="mb-1 block text-black/70">Access</span>
							<select value={s.access ?? ''} onChange={(e) => updateSecondary(idx, { access: (e.target.value || null) as any })} className="w-full rounded border border-black/10 bg-white px-2 py-1 outline-none">
								<option value="">—</option>
								<option value="public">Public</option>
								<option value="key_required">Key required</option>
							</select>
						</label>
						<label className="block text-xs sm:col-span-1">
							<span className="mb-1 block text-black/70">Name</span>
							<input value={s.displayName ?? ''} onChange={(e) => updateSecondary(idx, { displayName: e.target.value })} placeholder="e.g. Webhook" className="w-full rounded border border-black/10 bg-white px-2 py-1 outline-none" />
							{errors.secondary && errors.secondary[idx] && errors.secondary[idx].displayName && (<span className="mt-1 block text-[10px] text-red-600">{errors.secondary[idx].displayName}</span>)}
						</label>
						<label className="block text-xs sm:col-span-1">
							<span className="mb-1 block text-black/70">Key request URL</span>
							<input value={s.keyRequestUrl ?? ''} onChange={(e) => updateSecondary(idx, { keyRequestUrl: e.target.value })} className="w-full rounded border border-black/10 bg-white px-2 py-1 outline-none" />
							{errors.secondary && errors.secondary[idx] && errors.secondary[idx].keyRequestUrl && (<span className="mt-1 block text-[10px] text-red-600">{errors.secondary[idx].keyRequestUrl}</span>)}
						</label>
						<div className="flex items-end sm:col-span-1">
							<button type="button" onClick={() => removeSecondary(idx)} className="h-8 rounded border border-black/10 bg-white px-2 text-xs text-black/70 hover:bg-black/5">Remove</button>
						</div>
						<label className="block text-xs sm:col-span-6">
							<span className="mb-1 block text-black/70">Notes</span>
							<input value={s.notes ?? ''} onChange={(e) => updateSecondary(idx, { notes: e.target.value })} placeholder="Short description of this endpoint" className="w-full rounded border border-black/10 bg-white px-2 py-1 outline-none" />
						</label>
					</div>
				))}
			</div>

			<div className="pt-2">
				<button type="submit" className="inline-flex items-center rounded bg-[var(--color-accent-600)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-700)]">Save</button>
			</div>
		</form>
	)
}


