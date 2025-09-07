import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useData } from '../providers/DataProvider'
import AgentCard from '../components/AgentCard'
import { Link } from 'react-router-dom'

export default function Builder() {
	const { publicKey, connected } = useWallet()
	const { listAgents } = useData()
	const [loading, setLoading] = useState(false)
	const [agents, setAgents] = useState([])

	useEffect(() => {
		let mounted = true
		if (!connected) return () => { mounted = false }
		setLoading(true)
		listAgents().then((data) => {
			if (!mounted) return
			setAgents(data as any)
			setLoading(false)
		})
		return () => { mounted = false }
	}, [listAgents, connected])

	const owner = useMemo(() => publicKey?.toBase58() ?? '', [publicKey])
	const mine = useMemo(
		() => (connected ? (agents as any[]).filter((a) => a.ownerWallet === owner) : []),
		[agents, connected, owner],
	)

	return (
		<div>
			<h1 className="text-2xl font-semibold">Builder space</h1>
			{!connected && (
				<p className="mt-2 text-sm text-[var(--color-muted)]" data-testid="builder-disconnected">
					Connect your wallet to manage your agents.
				</p>
			)}
			{connected && (
				<div className="mt-2 text-sm text-[var(--color-muted)]">
					Wallet: <code>{owner.slice(0, 8)}…</code>
				</div>
			)}
			{connected && (
				<div className="mt-4">
					<Link to="/agent/new" className="inline-flex items-center rounded bg-[var(--color-accent-600)] px-3 py-1.5 text-sm font-medium !text-white hover:bg-[var(--color-accent-700)]">Create agent</Link>
				</div>
			)}
			<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{connected && loading && <p>Loading…</p>}
				{connected && !loading && mine.length === 0 && (
					<p>No agents for this wallet.</p>
				)}
				{connected && !loading && mine.map((a) => <AgentCard key={a.id} agent={a as any} />)}
			</div>
		</div>
	)
}


