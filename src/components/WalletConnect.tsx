import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function WalletConnect() {
	return (
		<div className="flex justify-end">
			<WalletMultiButton className="!bg-[var(--color-accent-600)] !text-white hover:!bg-[var(--color-accent-700)] focus:!bg-[var(--color-accent-700)] active:!bg-[var(--color-accent-700)] !px-3 !py-1.5 !text-sm !rounded" />
		</div>
	)
}


