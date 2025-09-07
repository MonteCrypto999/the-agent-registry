import { Link, Outlet } from 'react-router-dom'
import { SolanaWalletProvider } from '../wallet/WalletProvider'
import WalletConnect from './WalletConnect'
import ErrorBoundary from './ErrorBoundary'
import { useState } from 'react'

export default function Layout() {
	const [open, setOpen] = useState(false)
	return (
		<SolanaWalletProvider>
			<div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)]">
				<header className="sticky top-0 z-20 border-b border-black/10 bg-white/80 backdrop-blur">
					<div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
						<div className="flex items-center gap-3">
							<button className="sm:hidden rounded border border-black/10 bg-white p-2" aria-label="Open menu" onClick={() => setOpen(true)}>
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
							</button>
							<Link to="/" className="flex items-center gap-2">
								<span className="text-lg font-semibold tracking-tight text-[var(--color-accent-600)]">The Agent Registry</span>
							</Link>
						</div>
						<nav className="hidden items-center gap-4 text-sm text-[var(--color-muted)] sm:flex">
							<Link to="/" className="hover:text-[var(--color-fg)]">Agents</Link>
							<Link to="/builder" className="hover:text-[var(--color-fg)]">Builder</Link>
							<Link to="/how-it-works" className="hover:text-[var(--color-fg)]">How it works?</Link>
						</nav>
						<div className="hidden sm:block">
							<WalletConnect />
						</div>
					</div>
				</header>

				{/* Mobile drawer */}
				<div className={`fixed inset-0 z-30 ${open ? '' : 'pointer-events-none'}`}>
					<div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
					<div className={`absolute left-0 top-0 h-full w-80 max-w-[80%] transform bg-white text-black shadow-xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
						<div className="flex items-center justify-between border-b border-black/10 p-3">
							<span className="flex items-center gap-2"><span className="font-semibold text-[var(--color-accent-600)]">The Agent Registry</span></span>
							<button className="rounded border border-black/10 bg-white p-2" aria-label="Close menu" onClick={() => setOpen(false)}>
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
							</button>
						</div>
						<nav className="p-3 text-sm">
							<Link to="/" onClick={() => setOpen(false)} className="block rounded px-2 py-2 hover:bg-black/5">Agents</Link>
							<Link to="/builder" onClick={() => setOpen(false)} className="mt-1 block rounded px-2 py-2 hover:bg-black/5">Builder</Link>
							<Link to="/how-it-works" onClick={() => setOpen(false)} className="mt-1 block rounded px-2 py-2 hover:bg-black/5">How it works?</Link>
							<div className="mt-4 flex justify-center">
								<WalletConnect />
							</div>
						</nav>
					</div>
				</div>

				<main className="mx-auto max-w-6xl px-4 py-6">
					<ErrorBoundary>
						<Outlet />
					</ErrorBoundary>
				</main>
			</div>
		</SolanaWalletProvider>
	)
}


