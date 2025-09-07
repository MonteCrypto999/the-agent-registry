import { TAGS } from '../seed'
import { getTagClasses } from '../lib/tagStyles'
import { useMemo, useState } from 'react'

export interface TagFilterBarProps {
	selected: string[]
	onChange: (next: string[]) => void
	maxVisible?: number
}

type TagItem = (typeof TAGS)[number] & { category?: string | null }

export default function TagFilterBar({ selected, onChange, maxVisible }: TagFilterBarProps) {
	const [showAll, setShowAll] = useState(false)
	function toggle(slug: string) {
		const set = new Set(selected)
		if (set.has(slug)) set.delete(slug)
		else set.add(slug)
		onChange([...set])
	}

	const grouped = useMemo(() => {
		const map = new Map<string, TagItem[]>()
		for (const t of TAGS as ReadonlyArray<TagItem>) {
			const cat = (t.category ?? 'Other') as string
			if (!map.has(cat)) map.set(cat, [])
			map.get(cat)!.push(t)
		}
		return map
	}, [])

	const collapsed = useMemo(() => {
		if (!maxVisible) return TAGS.slice() as TagItem[]
		const result: TagItem[] = []
		const perCat = 2
		for (const [, arr] of grouped) {
			for (let i = 0; i < arr.length && i < perCat; i++) {
				result.push(arr[i])
				if (result.length >= maxVisible) return result
			}
		}
		for (const t of TAGS as ReadonlyArray<TagItem>) {
			if (result.includes(t)) continue
			result.push(t)
			if (result.length >= maxVisible) break
		}
		return result
	}, [grouped, maxVisible])

	const visible = showAll || !maxVisible ? (TAGS.slice() as TagItem[]) : collapsed
	const hasMore = !showAll && !!maxVisible && TAGS.length > maxVisible

	return (
		<div className="flex flex-col gap-2">
			{showAll ? (
				<div className="flex flex-col gap-3">
					{Array.from(grouped.entries()).map(([cat, arr]) => (
						<div key={cat}>
							<div className="mb-1 text-xs font-semibold uppercase text-black/50">{cat}</div>
							<div className="flex flex-wrap items-center gap-2">
								{arr.map((tag) => {
									const active = selected.includes(tag.slug)
									return (
										<button key={tag.id} onClick={() => toggle(tag.slug)} className={getTagClasses(tag.slug, { active, category: tag.category ?? null })}>{tag.label}</button>
									)
								})}
							</div>
						</div>
					))}
				</div>
			) : (
				<div>
					<div className="flex flex-wrap items-center gap-2 overflow-hidden max-h-16 sm:max-h-none">
						{visible.map(tag => {
							const active = selected.includes(tag.slug)
							return (
								<button key={tag.id} onClick={() => toggle(tag.slug)} className={getTagClasses(tag.slug, { active, category: (tag as any).category ?? null })}>{tag.label}</button>
							)
						})}
					</div>
					{hasMore && (
						<button onClick={() => setShowAll(true)} className="mt-1 text-xs text-[var(--color-accent-600)] hover:underline">Show more</button>
					)}
				</div>
			)}
			{showAll && !!maxVisible && TAGS.length > maxVisible && (
				<button onClick={() => setShowAll(false)} className="text-xs text-[var(--color-accent-600)] hover:underline self-start">Show less</button>
			)}
		</div>
	)
}


