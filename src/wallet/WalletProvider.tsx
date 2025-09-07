import type { FC, ReactNode } from 'react'
import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import '@solana/wallet-adapter-react-ui/styles.css'

export const SolanaWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const endpoint = 'https://api.mainnet-beta.solana.com'
	const wallets = useMemo(() => [
		new PhantomWalletAdapter(),
		new SolflareWalletAdapter(),
	], [])

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	)
}


