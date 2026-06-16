import { z } from "zod";

export const relatedTopicSchema = z.object({
	type: z.string().min(1),
	title: z.string().min(1),
	href: z.string().min(1),
	relation: z.string().optional(),
});

export type RelatedTopic = z.infer<typeof relatedTopicSchema>;

export const relatedFileSchema = z.object({
	version: z.literal(1),
	topics: z.array(relatedTopicSchema).default([]),
});

export type RelatedFile = z.infer<typeof relatedFileSchema>;

export function emptyRelatedFile(): RelatedFile {
	return { version: 1, topics: [] };
}

export function parseRelatedFile(
	raw: unknown,
	context = "related.json",
): RelatedFile {
	const parsed = relatedFileSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid related file — ${msg}`);
	}
	return parsed.data;
}

export function relatedTopicsFromFrontmatter(
	raw: unknown,
): RelatedTopic[] {
	if (!Array.isArray(raw)) return [];
	const topics: RelatedTopic[] = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const record = item as Record<string, unknown>;
		if (!record.title || !record.href) continue;
		topics.push({
			type: String(record.type ?? "Feature"),
			title: String(record.title),
			href: String(record.href),
			relation: record.relation ? String(record.relation) : undefined,
		});
	}
	return topics;
}

export function hrefToSlug(href: string): string {
	const normalized = href.replace(/^\//, "").replace(/\/$/, "");
	return normalized.startsWith("platform-spec")
		? normalized
		: `platform-spec/${normalized}`;
}
