import type { AgentWithRelations } from '../types'
import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'

export default function AgentCard({ agent }: { agent: AgentWithRelations }) {
	const primary = agent.interfaces.find(i => i.isPrimary)
	const isApi = primary?.kind === 'api'
	const access = primary?.accessPolicy
	return (
		<div className="rounded-lg border border-black/10 bg-white p-4">
			<div className="flex items-start gap-4">
				<SafeImage src={agent.thumbnailUrl ?? undefined} alt={agent.name} className="size-16 shrink-0 rounded-md object-cover" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h3 className="truncate text-base font-semibold">{agent.name}</h3>
						{isApi ? (
							<span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">API</span>
						) : (
							<span className="rounded bg-[var(--color-accent-500)]/10 px-2 py-0.5 text-xs text-[var(--color-accent-600)]">Website</span>
						)}
						{isApi && access && (
							<span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
								{access === 'public' ? 'Public' : 'Key required'}
							</span>
						)}
					</div>
					<p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted)]">{agent.summary}</p>
					<div className="mt-3 flex items-center gap-2">
						{agent.tags.slice(0, 3).map(t => (
							<span key={t.id} className="rounded bg-black/5 px-2 py-0.5 text-xs text-black/60">
								{t.label}
							</span>
						))}
					</div>
				</div>
			</div>
			<div className="mt-4">
				<Link to={`/agent/${agent.id}`} className="inline-flex items-center rounded bg-[var(--color-accent-600)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-700)]">
					View
				</Link>
			</div>
		</div>
	)
}


