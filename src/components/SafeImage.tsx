import { useState } from 'react'

function stringHash(input: string): number {
	let hash = 0
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i)
		hash |= 0
	}
	return Math.abs(hash)
}

function gradientFor(text: string): string {
	const h = stringHash(text)
	const hue1 = h % 360
	const hue2 = (h * 7) % 360
	const c1 = `hsl(${hue1} 80% 90%)`
	const c2 = `hsl(${hue2} 80% 80%)`
	return `linear-gradient(135deg, ${c1}, ${c2})`
}

export default function SafeImage({ src, alt, className }: { src?: string | null, alt: string, className?: string }) {
	const [error, setError] = useState(false)
	if (!src || error) {
		return <div className={className} aria-label={alt} style={{ background: gradientFor(alt) }} />
	}
	return (
		<img
			src={src}
			alt={alt}
			className={className}
			loading="lazy"
			onError={() => setError(true)}
		/>
	)
}


