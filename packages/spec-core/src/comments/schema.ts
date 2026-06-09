import { z } from "zod";

export const specCommentSchema = z.object({
	id: z.string().min(1),
	author: z.string().min(1),
	body: z.string().min(1),
	createdAt: z.string().min(1),
	resolved: z.boolean().default(false),
	anchor: z
		.object({
			sectionId: z.string().optional(),
			line: z.number().int().positive().optional(),
		})
		.optional(),
});

export type SpecComment = z.infer<typeof specCommentSchema>;

export const nodeCommentsSchema = z.object({
	version: z.literal(1),
	comments: z.array(specCommentSchema).default([]),
});

export type NodeComments = z.infer<typeof nodeCommentsSchema>;

export function parseNodeComments(
	raw: unknown,
	context = "comments.json",
): NodeComments {
	const parsed = nodeCommentsSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid comments — ${msg}`);
	}
	return parsed.data;
}

export function emptyNodeComments(): NodeComments {
	return { version: 1, comments: [] };
}
