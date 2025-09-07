import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { AgentWithRelations } from '../types'
import { useData } from '../providers/DataProvider'
import SafeImage from '../components/SafeImage'
import SocialIcon from '../components/SocialIcon'

export default function AgentDetail() {
	const { id } = useParams()
	const { getAgentById } = useData()
	const [agent, setAgent] = useState<AgentWithRelations | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		if (!id) return
		setLoading(true)
		getAgentById(id).then((a) => {
			if (!cancelled) setAgent(a)
		}).finally(() => {
			if (!cancelled) setLoading(false)
		})
		return () => { cancelled = true }
	}, [id, getAgentById])

	if (loading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>
	if (!agent) return <p className="text-sm text-[var(--color-muted)]">Agent not found.</p>
	const primary = agent.interfaces.find(i => i.isPrimary)
	const isApi = primary?.kind === 'api'
	const socials = agent.socials ?? {}
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Link to="/" className="inline-flex items-center gap-1 rounded border border-black/10 bg-white px-2 py-1 text-sm text-black/70 hover:bg-black/5">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
						Back
					</Link>
					<h1 className="text-2xl font-semibold">{agent.name}</h1>
				</div>
			</div>
			<div className="flex items-start gap-4">
				<SafeImage src={agent.thumbnailUrl ?? undefined} alt={agent.name} className="h-32 w-32 shrink-0 rounded object-cover sm:h-40 sm:w-40" />
				<div className="min-w-0 flex-1">
					<p className="text-sm text-[var(--color-muted)]">{agent.summary}</p>
					{Object.keys(socials).length > 0 && (
						<div className="mt-3 flex flex-wrap items-center gap-3">
							{Object.entries(socials).map(([k, v]) => (
								<a key={k} href={v as string} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-black/70 hover:underline">
									<SocialIcon name={k} className="h-4 w-4" />
									<span className="capitalize">{k}</span>
								</a>
							))}
						</div>
					)}
				</div>
			</div>
			<div>
				<h2 className="text-sm font-semibold">How to use</h2>
				{isApi ? (
					<div className="mt-2 text-xs">
						<p>Endpoint: <code className="rounded bg-black/5 px-1 py-0.5">{primary?.url}</code></p>
						{primary?.accessPolicy === 'key_required' ? (
							<p className="mt-2">Key required. Get a key: <a className="text-[var(--color-accent-600)] hover:underline" href={primary?.keyRequestUrl ?? '#'} target="_blank" rel="noreferrer">builder page</a></p>
						) : (
							<p className="mt-2">Public access</p>
						)}
					</div>
				) : (
					<div className="mt-2">
						<a className="inline-flex items-center rounded bg-[var(--color-accent-600)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-700)]" href={primary?.url} target="_blank" rel="noreferrer">Visit website</a>
					</div>
				)}
			</div>
		</div>
	)
}


