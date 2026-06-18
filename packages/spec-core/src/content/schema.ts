import { widgetSpecSchema } from "../layout/schema.js";
import { z } from "zod";

const specSectionContentSchema = z.object({
	type: z.literal("specSection"),
	id: z.string().min(1),
	title: z.string().optional(),
	bodyMd: z.string().default(""),
});

const markdownProseContentSchema = z.object({
	type: z.literal("markdownProse"),
	bodyMd: z.string().default(""),
});

const domainTilesContentSchema = z.object({
	type: z.literal("domainTiles"),
	props: z.object({
		pathPrefix: z.string().min(1),
		heading: z.string().default("Explore"),
	}),
});

const twoColumnContentSchema = z.object({
	type: z.literal("twoColumn"),
	props: z.object({
		gap: z.enum(["sm", "md", "lg"]).default("md"),
		left: z.array(widgetSpecSchema),
		right: z.array(widgetSpecSchema),
	}),
});

export const contentBlockSchema = z.discriminatedUnion("type", [
	specSectionContentSchema,
	markdownProseContentSchema,
	domainTilesContentSchema,
	twoColumnContentSchema,
]);

export type ContentBlock = z.infer<typeof contentBlockSchema>;

export const nodeContentSchema = z.object({
	version: z.literal(1),
	blocks: z.array(contentBlockSchema).default([]),
});

export type NodeContent = z.infer<typeof nodeContentSchema>;

export function parseNodeContent(
	raw: unknown,
	context = "content.json",
): NodeContent {
	const parsed = nodeContentSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid content — ${msg}`);
	}
	return parsed.data;
}

export function emptyNodeContent(): NodeContent {
	return { version: 1, blocks: [] };
}
