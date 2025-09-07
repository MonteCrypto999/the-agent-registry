import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; message?: string }

export default class ErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false }

	static getDerivedStateFromError(error: unknown): State {
		return { hasError: true, message: (error as any)?.message ?? 'Something went wrong' }
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error('UI ErrorBoundary:', error, info)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="mx-auto max-w-2xl rounded border border-red-500/30 bg-red-500/10 p-4 text-sm">
					<p className="font-semibold text-red-300">Runtime error</p>
					<p className="mt-1 text-red-200">{this.state.message}</p>
				</div>
			)
		}
		return this.props.children
	}
}


