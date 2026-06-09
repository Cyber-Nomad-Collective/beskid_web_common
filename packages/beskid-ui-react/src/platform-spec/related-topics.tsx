export function RelatedTopics({
	topics,
}: {
	topics: { href: string; title: string }[];
}) {
	if (!topics.length) return null;
	return (
		<section className="rounded-lg border border-border/60 p-4">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				Related topics
			</h2>
			<ul className="mt-3 flex flex-wrap gap-2">
				{topics.map((topic) => (
					<li key={topic.href}>
						<a
							href={topic.href}
							className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary/40"
						>
							{topic.title}
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
