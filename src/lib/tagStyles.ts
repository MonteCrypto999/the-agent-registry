export function getTagClasses(_slug: string, opts?: { active?: boolean; category?: string | null }) {
	const active = Boolean(opts?.active)
	const base = 'rounded border border-black/10 bg-white px-2 py-0.5 text-xs text-black/70 hover:bg-black/5'
	const activeCls = 'rounded border px-2 py-0.5 text-xs bg-[var(--color-accent-600)] text-white border-[var(--color-accent-600)]'
	return active ? activeCls : base
}


