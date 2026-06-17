import { z } from "zod";
import { specLevelSchema } from "../workspace/schema.js";
import {
	architectureGraphAttachmentSchema,
	type ArchitectureGraphAttachment,
} from "../architecture/schema.js";

export const nodeMetadataSchema = z.object({
	version: z.literal(1),
	specLevel: specLevelSchema,
	slug: z.string().min(1),
	title: z.string().min(1),
	description: z.string().optional(),
	parentSlug: z.string().nullable().optional(),
	status: z.string().optional(),
	architectureGraph: architectureGraphAttachmentSchema.optional(),
	owner: z
		.object({
			name: z.string().optional(),
			email: z.string().optional(),
		})
		.optional(),
	submitter: z
		.object({
			name: z.string().optional(),
			email: z.string().optional(),
		})
		.optional(),
	adrId: z.string().optional(),
	adrStatus: z.string().optional(),
	adrDate: z.string().optional(),
	relatedTopics: z.array(z.string()).optional(),
	lastReviewed: z.string().optional(),
});

export type NodeMetadata = z.infer<typeof nodeMetadataSchema>;
export type NodeArchitectureGraph = ArchitectureGraphAttachment;

export function parseNodeMetadata(
	raw: unknown,
	context = "node.json",
): NodeMetadata {
	const parsed = nodeMetadataSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid node metadata — ${msg}`);
	}
	return parsed.data;
}

export function nodeMetadataToFrontmatter(
	node: NodeMetadata,
): Record<string, unknown> {
	const fm: Record<string, unknown> = {
		title: node.title,
		description: node.description,
		specLevel: node.specLevel === "root" ? "domain" : node.specLevel,
	};

	if (node.owner) fm.owner = node.owner;
	if (node.submitter) fm.submitter = node.submitter;
	if (node.status) fm.status = node.status;
	if (node.architectureGraph) fm.architectureGraph = node.architectureGraph;
	if (node.adrId) fm.adrId = node.adrId;
	if (node.adrStatus) fm.adrStatus = node.adrStatus;
	if (node.adrDate) fm.adrDate = node.adrDate;
	if (node.relatedTopics?.length) fm.relatedTopics = node.relatedTopics;
	if (node.lastReviewed) fm.lastReviewed = node.lastReviewed;

	return fm;
}
