import { useEffect, useMemo, useState } from 'react'
import TagFilterBar from '../components/TagFilterBar'
import { filterAgents } from '../lib/filter'
import { useSearchParams } from 'react-router-dom'
import AgentListItem from '../components/AgentListItem'
import { useData } from '../providers/DataProvider'

export default function Home() {
    const { listAgents } = useData()
	const [sp, setSp] = useSearchParams()
	const [query, setQuery] = useState('')
	const [tagSlugs, setTagSlugs] = useState<string[]>([])
    const [agents, setAgents] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

	useEffect(() => {
		const q = sp.get('q') ?? ''
		const t = sp.get('tags')?.split(',').filter(Boolean) ?? []
		setQuery(q)
		setTagSlugs(t)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        listAgents().then((res) => {
            if (!cancelled) setAgents(res)
        }).finally(() => {
            if (!cancelled) setLoading(false)
        })
        return () => { cancelled = true }
    }, [listAgents])

	useEffect(() => {
		const next = new URLSearchParams(sp)
		if (query) next.set('q', query); else next.delete('q')
		if (tagSlugs.length) next.set('tags', tagSlugs.join(',')); else next.delete('tags')
		setSp(next, { replace: true })
	}, [query, tagSlugs, setSp])

	const filtered = useMemo(() => filterAgents(agents, { query, tagSlugs }), [agents, query, tagSlugs])
	const sorted = useMemo(() => filtered.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), [filtered])
	return (
		<div>
			<h1 className="text-2xl font-semibold">Agents</h1>
			<p className="mt-2 text-sm text-[var(--color-muted)]">List of agents</p>
            {loading && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading…</p>}
			<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search…"
					className="w-full max-w-sm rounded border border-black/10 bg-white px-3 py-2 text-sm outline-none placeholder:text-black/40"
				/>
				<TagFilterBar selected={tagSlugs} onChange={setTagSlugs} maxVisible={14} />
			</div>
			{sorted.length === 0 ? (
				<p className="mt-6 text-sm text-[var(--color-muted)]">No agents match your filters.</p>
			) : (
				<ul className="mt-6">
					{sorted.map((a) => (
						<AgentListItem key={a.id} agent={a} />
					))}
				</ul>
			)}
		</div>
	)
}


