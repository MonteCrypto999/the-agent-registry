import type { AgentWithRelations } from '../types'
import SafeImage from './SafeImage'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getTagClasses } from '../lib/tagStyles'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'

export default function AgentListItem({ agent }: { agent: AgentWithRelations }) {
	const [showApi, setShowApi] = useState(false)
	const [showDonate, setShowDonate] = useState(false)
	const [donationSol, setDonationSol] = useState('')
	const [sending, setSending] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [successSig, setSuccessSig] = useState<string | null>(null)
	const { publicKey, sendTransaction, connected } = useWallet()
	const { setVisible } = useWalletModal()
	const { connection } = useConnection()

	const website = agent.interfaces.find(i => i.kind === 'web_ui')
	const apis = agent.interfaces.filter(i => i.kind === 'api')
	const primaryApi = apis.find(a => a.isPrimary)
	const apiButtonLabel = primaryApi ? (primaryApi.accessPolicy === 'public' ? 'Public API' : 'API') : 'API'

	async function handleDonate() {
		setError(null)
		setSuccessSig(null)
		try {
			if (!connected || !publicKey) {
				setVisible(true)
				throw new Error('Connect wallet to donate')
			}
			if (!agent.donationWallet) throw new Error('No donation address')
			const to = new PublicKey(agent.donationWallet)
			const amount = parseFloat(donationSol)
			if (!isFinite(amount) || amount <= 0) throw new Error('Enter a valid SOL amount')
			const lamports = Math.round(amount * LAMPORTS_PER_SOL)
			const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: to, lamports }))
			setSending(true)
			const sig = await sendTransaction(tx, connection)
			setSuccessSig(sig)
		} catch (e: any) {
			setError(e?.message ?? String(e))
		} finally {
			setSending(false)
		}
	}

	return (
		<li className="border-b border-black/10 py-3">
			<div className="flex gap-3">
				<Link to={`/agent/${agent.id}`} className="block">
					<SafeImage src={agent.thumbnailUrl ?? undefined} alt={agent.name} className="size-10 shrink-0 rounded object-cover" />
				</Link>
				<div className="min-w-0 flex-1">
					{/* Header row: title left, actions right */}
					<div className="flex items-center justify-between gap-2">
						<Link to={`/agent/${agent.id}`} className="min-w-0 truncate font-medium hover:underline">{agent.name}</Link>
						<div className="flex items-center gap-2">
							{apis.length > 0 && (
								<button onClick={() => setShowApi(v => !v)} className={`rounded px-2 py-1 text-xs transition-colors ${showApi ? 'bg-[var(--color-accent-600)] text-white' : 'border border-black/10 bg-white text-black/70 hover:bg-black/5'}`}>{apiButtonLabel}</button>
							)}
							{website && (
								<a href={website.url} target="_blank" rel="noreferrer" className="rounded border border-black/10 bg-white px-2 py-1 text-xs text-black/70 hover:bg-black/5">Website</a>
							)}
							{agent.donationWallet && (
								<button aria-label="Donate" onClick={() => setShowDonate(v => !v)} className={`rounded px-2 py-1 text-xs transition-colors ${showDonate ? 'bg-[var(--color-accent-600)] text-white' : 'border border-black/10 bg-white text-black/70 hover:bg-black/5'}`}>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.001 4.529c2.349-2.35 6.165-2.35 8.514 0 2.349 2.35 2.349 6.157 0 8.507l-6.364 6.364a.75.75 0 0 1-1.06 0L3.727 13.036c-2.349-2.35-2.349-6.157 0-8.507 2.349-2.35 6.165-2.35 8.514 0Z" fill="currentColor"/></svg>
								</button>
							)}
						</div>
					</div>

					<p className="mt-0.5 text-sm text-[var(--color-muted)] sm:line-clamp-1">{agent.summary}</p>

					{/* Tags: two rows on mobile (approx: up to 8); more on desktop */}
					<div className="mt-2 flex flex-wrap gap-2 sm:hidden">
						{agent.tags.slice(0, 8).map(t => (
							<span key={t.id} className={getTagClasses(t.slug, { category: (t as any).category ?? null })}>{t.label}</span>
						))}
					</div>
					<div className="mt-2 hidden flex-wrap gap-2 sm:flex">
						{agent.tags.slice(0, 12).map(t => (
							<span key={t.id} className={getTagClasses(t.slug, { category: (t as any).category ?? null })}>{t.label}</span>
						))}
					</div>
				</div>
			</div>

			{/* API expand */}
			<div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${showApi ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
				<div className="overflow-hidden">
					{apis.length > 0 && (
						<div className="mt-3 rounded border border-black/10 bg-white p-3 text-xs">
							{apis.map((api, idx) => (
								<div key={api.id} className={idx > 0 ? 'mt-2 border-t border-black/5 pt-2' : ''}>
									<div className="flex items-center justify-between gap-2">
										<div className="font-medium text-black/80">{api.displayName || (api.isPrimary ? 'Primary' : 'Secondary')} {api.accessPolicy === 'public' ? '(Public)' : api.accessPolicy === 'key_required' ? '(Key)' : ''}</div>
										<a className="text-[var(--color-accent-600)] hover:underline break-all" target="_blank" rel="noreferrer" href={api.url}>{api.url}</a>
									</div>
									{api.notes && <div className="mt-1 text-black/60">{api.notes}</div>}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
			{/* Donate expand */}
			<div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${showDonate ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
				<div className="overflow-hidden">
					{agent.donationWallet && (
						<div className="mt-3 rounded border border-black/10 bg-white p-3 text-xs">
							<p className="mb-2 text-black/70">Show some love—send a tip to this agent ✨</p>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="truncate"><span className="text-black/60">Donation Address:</span> <code className="rounded bg-black/5 px-1 py-0.5">{agent.donationWallet}</code></div>
								<div className="flex items-center gap-2">
									<input
										type="number"
										min="0"
										step="0.001"
										placeholder="Amount (SOL)"
										className="w-32 rounded border border-black/10 bg-white px-2 py-1 text-xs outline-none"
										value={donationSol}
										onChange={(e) => setDonationSol(e.target.value)}
									/>
									<button disabled={sending} onClick={handleDonate} className="rounded bg-[var(--color-accent-600)] px-2 py-1 text-xs font-medium text-white hover:bg-[var(--color-accent-700)] disabled:opacity-50">Donate</button>
								</div>
							</div>
							{error && <div className="mt-2 text-[10px] text-red-600">{error}</div>}
							{successSig && (
								<div className="mt-2 text-[10px] text-emerald-700">Sent. Sig: <a className="underline" target="_blank" rel="noreferrer" href={`https://solscan.io/tx/${successSig}`}>{successSig.slice(0, 8)}…</a></div>
							)}
						</div>
					)}
				</div>
			</div>
		</li>
	)
}


