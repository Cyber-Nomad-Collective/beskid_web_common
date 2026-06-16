import { z } from "zod";
import { architectureComponentSchema } from "./components.js";
import { architectureRelationSchema } from "./relations.js";

const nonEmpty = z.string().trim().min(1);

export const architectureGraphGroupSchema = z.object({
	id: nonEmpty,
	label: nonEmpty,
	color: z.string().optional(),
	description: z.string().optional(),
});

/** Legacy v1 untyped graph (website / Astro era). */
export const architectureGraphV1NodeSchema = z.object({
	id: nonEmpty,
	label: nonEmpty,
	group: z.string().optional(),
	description: z.string().optional(),
	href: z.string().optional(),
	tags: z.array(z.string()).optional(),
	meta: z.record(z.string(), z.string()).optional(),
	hidden: z.boolean().optional(),
});

export const architectureGraphV1EdgeSchema = z.object({
	id: z.string().optional(),
	from: nonEmpty,
	to: nonEmpty,
	label: z.string().optional(),
	description: z.string().optional(),
	hidden: z.boolean().optional(),
});

export const architectureGraphV1Schema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	groups: z.array(architectureGraphGroupSchema).optional(),
	nodes: z.array(architectureGraphV1NodeSchema).min(1),
	edges: z.array(architectureGraphV1EdgeSchema).default([]),
});

export const architectureGraphV2Schema = z.object({
	version: z.literal(2),
	title: z.string().optional(),
	description: z.string().optional(),
	groups: z.array(architectureGraphGroupSchema).optional(),
	nodes: z.array(architectureComponentSchema).min(1),
	edges: z.array(architectureRelationSchema).default([]),
});

export type ArchitectureGraphV1 = z.infer<typeof architectureGraphV1Schema>;
export type ArchitectureGraphV2 = z.infer<typeof architectureGraphV2Schema>;
export type ArchitectureGraphGroup = z.infer<
	typeof architectureGraphGroupSchema
>;

export const architectureGraphAttachmentSchema = z.object({
	graphKey: nonEmpty,
	entryNode: z.string().optional(),
	layout: z.enum(["hierarchy", "force"]).optional(),
});

export type ArchitectureGraphAttachment = z.infer<
	typeof architectureGraphAttachmentSchema
>;

export function isArchitectureGraphV2(
	raw: unknown,
): raw is ArchitectureGraphV2 {
	return (
		typeof raw === "object" &&
		raw !== null &&
		(raw as { version?: number }).version === 2
	);
}

export function parseArchitectureGraphV2(
	raw: unknown,
	context = "architecture graph",
): ArchitectureGraphV2 {
	const parsed = architectureGraphV2Schema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid v2 graph — ${msg}`);
	}
	return parsed.data;
}

export function parseArchitectureGraphV1(
	raw: unknown,
	context = "architecture graph",
): ArchitectureGraphV1 {
	const parsed = architectureGraphV1Schema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid v1 graph — ${msg}`);
	}
	return parsed.data;
}
