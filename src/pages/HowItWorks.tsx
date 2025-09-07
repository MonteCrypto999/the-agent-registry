export default function HowItWorks() {
	return (
		<div className="mx-auto max-w-3xl space-y-8">
			<section className="space-y-2">
				<h1 className="text-3xl font-bold">How it works</h1>
				<p className="text-[var(--color-muted)]">
					ElizaOS Registry helps you discover, evaluate, and submit ElizaOS-powered agents. Browse the
					catalog, filter with tags, expand inline API details, or jump straight to a website.
				</p>
			</section>

			<section className="rounded border border-black/10 bg-white p-4">
				<h2 className="text-xl font-semibold">1) Discover agents</h2>
				<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/70">
					<li>Use the search input to match agent name and summary.</li>
					<li>
						Filter by tags. Click a tag to add it to the filter; click again to remove. Expand the tag
						panel to see categories (Crypto & Web3, Business & Productivity, Developer & Tech, Creative & Media,
						Knowledge & Education, Personal & Lifestyle, Specialized, Gaming).
					</li>
					<li>Agents are sorted by newest first (latest arrivals on top).</li>
				</ul>
			</section>

			<section className="rounded border border-black/10 bg-white p-4">
				<h2 className="text-xl font-semibold">2) Interface chips</h2>
				<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/70">
					<li>
						<strong>Website</strong>: opens the agent website in a new tab.
					</li>
					<li>
						<strong>API</strong>: expands inline with endpoint, access mode (Public or Key required), and a link to
						request a key when applicable.
					</li>
				</ul>
				<div className="mt-3 rounded border border-black/10 bg-white p-3 text-xs">
					<p className="mb-2 font-medium">Example (public API)</p>
					<pre className="overflow-x-auto rounded bg-black/5 p-3"><code>{`GET https://api.example.com/v1/endpoint
Accept: application/json`}</code></pre>
					<p className="mt-2">If a key is required, you will see a "Request a key" link.</p>
				</div>
			</section>

			<section className="rounded border border-black/10 bg-white p-4">
				<h2 className="text-xl font-semibold">3) Submit your agent</h2>
				<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/70">
					<li>Connect your wallet to unlock the Builder flow.</li>
					<li>Provide name, summary, and a primary interface (Website or API URL).</li>
					<li>Choose up to 4 tags that best represent your agent (balanced across categories works best).</li>
					<li>If your interface is an API, specify the access mode and optional key request URL.</li>
				</ul>
				<div className="mt-3">
					<a
						href="/builder"
						className="inline-flex items-center rounded bg-[var(--color-accent-600)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-700)]"
					>
						Open Builder
					</a>
				</div>
			</section>

			<section className="rounded border border-black/10 bg-white p-4">
				<h2 className="text-xl font-semibold">Tips</h2>
				<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/70">
					<li>Write a concise, clear summary so users know exactly what the agent does.</li>
					<li>Pick tags that reflect the core function (e.g., Code, API, Marketing, Security).</li>
					<li>For APIs, include stable versioned endpoints and link to docs when possible.</li>
				</ul>
			</section>

			<section className="rounded border border-black/10 bg-white p-4">
				<h2 className="text-xl font-semibold">FAQ</h2>
				<div className="mt-2 space-y-3 text-sm text-black/70">
					<div>
						<p className="font-medium text-black">How do filters work?</p>
						<p>Filters are additive. Selecting multiple tags requires agents to match all chosen tags.</p>
					</div>
					<div>
						<p className="font-medium text-black">How are agents ordered?</p>
						<p>Newest arrivals first, based on their creation timestamp.</p>
					</div>
					<div>
						<p className="font-medium text-black">Can an agent have both Website and API?</p>
						<p>Yes. Chips appear for each interface; click Website to visit, click API to expand inline details.</p>
					</div>
				</div>
			</section>
		</div>
	)
}


