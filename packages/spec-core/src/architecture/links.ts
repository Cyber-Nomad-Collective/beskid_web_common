import { z } from "zod";
import { ARCHITECTURE_LINK_KINDS } from "./kinds.js";

const nonEmpty = z.string().trim().min(1);

export const specNodeLinkSchema = z.object({
	kind: z.literal("specNode"),
	slug: nonEmpty,
});

export const deployUrlLinkSchema = z.object({
	kind: z.literal("deployUrl"),
	url: z.string().url(),
	label: z.string().optional(),
});

export const githubRepoLinkSchema = z.object({
	kind: z.literal("githubRepo"),
	owner: nonEmpty,
	repo: nonEmpty,
	path: z.string().optional(),
});

export const cratePathLinkSchema = z.object({
	kind: z.literal("cratePath"),
	crate: nonEmpty,
	path: z.string().optional(),
});

export const workspaceRootLinkSchema = z.object({
	kind: z.literal("workspaceRoot"),
	path: nonEmpty,
});

export const rustModuleLinkSchema = z.object({
	kind: z.literal("rustModule"),
	crate: nonEmpty,
	modulePath: nonEmpty,
});

export const architectureLinkSchema = z.discriminatedUnion("kind", [
	specNodeLinkSchema,
	deployUrlLinkSchema,
	githubRepoLinkSchema,
	cratePathLinkSchema,
	workspaceRootLinkSchema,
	rustModuleLinkSchema,
]);

export type ArchitectureLink = z.infer<typeof architectureLinkSchema>;

export function parseArchitectureLink(
	raw: unknown,
	context = "link",
): ArchitectureLink {
	const parsed = architectureLinkSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid architecture link — ${msg}`);
	}
	return parsed.data;
}

export function isArchitectureLinkKind(
	value: string,
): value is (typeof ARCHITECTURE_LINK_KINDS)[number] {
	return (ARCHITECTURE_LINK_KINDS as readonly string[]).includes(value);
}
