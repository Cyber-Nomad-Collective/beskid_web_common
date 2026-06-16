import { z } from "zod";
import type { ArchitectureComponentKind } from "./kinds.js";
import { ARCHITECTURE_RELATION_KINDS } from "./kinds.js";

const nonEmpty = z.string().trim().min(1);

export const feedsRelationPropsSchema = z.object({
	artifact: z.string().optional(),
});

export const dependsOnRelationPropsSchema = z.object({
	version: z.string().optional(),
	optional: z.boolean().optional(),
});

export const containsRelationPropsSchema = z.object({
	order: z.number().int().optional(),
});

export const lowersToRelationPropsSchema = z.object({
	ir: z.string().optional(),
});

export const callsRelationPropsSchema = z.object({
	protocol: z.string().optional(),
});

export const referencesSpecRelationPropsSchema = z.object({
	slug: nonEmpty.optional(),
});

export const vendoredFromRelationPropsSchema = z.object({
	sourceUrl: z.string().url().optional(),
	revision: z.string().optional(),
});

export const implementsRelationPropsSchema = z.object({
	contract: z.string().optional(),
});

export const relatesToRelationPropsSchema = z.object({
	inferred: z.boolean().optional(),
});

const relationPropsByKind = {
	feeds: feedsRelationPropsSchema,
	dependsOn: dependsOnRelationPropsSchema,
	contains: containsRelationPropsSchema,
	lowersTo: lowersToRelationPropsSchema,
	calls: callsRelationPropsSchema,
	referencesSpec: referencesSpecRelationPropsSchema,
	vendoredFrom: vendoredFromRelationPropsSchema,
	implements: implementsRelationPropsSchema,
	relatesTo: relatesToRelationPropsSchema,
} as const;

export type RelationPropsByKind = {
	[K in keyof typeof relationPropsByKind]: z.infer<
		(typeof relationPropsByKind)[K]
	>;
};

function relationSchema<K extends (typeof ARCHITECTURE_RELATION_KINDS)[number]>(
	kind: K,
) {
	return z.object({
		id: z.string().optional(),
		kind: z.literal(kind),
		from: nonEmpty,
		to: nonEmpty,
		label: z.string().optional(),
		description: z.string().optional(),
		hidden: z.boolean().optional(),
		props: (relationPropsByKind[kind] as z.ZodTypeAny).optional().default({}),
	});
}

export const architectureRelationSchema = z.discriminatedUnion("kind", [
	relationSchema("feeds"),
	relationSchema("dependsOn"),
	relationSchema("contains"),
	relationSchema("lowersTo"),
	relationSchema("calls"),
	relationSchema("referencesSpec"),
	relationSchema("vendoredFrom"),
	relationSchema("implements"),
	relationSchema("relatesTo"),
]);

export type ArchitectureRelation = z.infer<typeof architectureRelationSchema>;

export function parseArchitectureRelation(
	raw: unknown,
	context = "edge",
): ArchitectureRelation {
	const parsed = architectureRelationSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid architecture relation — ${msg}`);
	}
	return parsed.data;
}

type KindSet = ArchitectureComponentKind[] | "*";

export interface RelationKindDefinition {
	kind: (typeof ARCHITECTURE_RELATION_KINDS)[number];
	allowedFromKinds: KindSet;
	allowedToKinds: KindSet;
}

export const RELATION_KIND_DEFINITIONS: RelationKindDefinition[] = [
	{
		kind: "feeds",
		allowedFromKinds: ["compilerPipelineStage", "astSyntaxNode", "group"],
		allowedToKinds: ["compilerPipelineStage", "astSyntaxNode", "rustModule"],
	},
	{
		kind: "dependsOn",
		allowedFromKinds: [
			"service",
			"rustModule",
			"compilerPipelineStage",
			"beskidProject",
		],
		allowedToKinds: ["dependency", "service", "rustModule"],
	},
	{
		kind: "contains",
		allowedFromKinds: ["group", "beskidWorkspace", "service"],
		allowedToKinds: "*",
	},
	{
		kind: "lowersTo",
		allowedFromKinds: ["compilerPipelineStage", "astSyntaxNode"],
		allowedToKinds: ["compilerPipelineStage", "astSyntaxNode"],
	},
	{
		kind: "calls",
		allowedFromKinds: ["service", "rustModule", "compilerPipelineStage"],
		allowedToKinds: ["service", "rustModule", "compilerPipelineStage"],
	},
	{
		kind: "referencesSpec",
		allowedFromKinds: "*",
		allowedToKinds: ["specNode", "service", "compilerPipelineStage"],
	},
	{
		kind: "vendoredFrom",
		allowedFromKinds: ["dependency"],
		allowedToKinds: ["dependency", "service"],
	},
	{
		kind: "implements",
		allowedFromKinds: [
			"beskidProject",
			"rustModule",
			"dependency",
			"compilerPipelineStage",
		],
		allowedToKinds: ["specNode", "compilerPipelineStage"],
	},
	{
		kind: "relatesTo",
		allowedFromKinds: "*",
		allowedToKinds: "*",
	},
];

function kindAllowed(set: KindSet, kind: ArchitectureComponentKind): boolean {
	return set === "*" || set.includes(kind);
}

export function isRelationAllowed(
	relationKind: ArchitectureRelation["kind"],
	fromKind: ArchitectureComponentKind,
	toKind: ArchitectureComponentKind,
): boolean {
	const def = RELATION_KIND_DEFINITIONS.find((d) => d.kind === relationKind);
	if (!def) return false;
	return (
		kindAllowed(def.allowedFromKinds, fromKind) &&
		kindAllowed(def.allowedToKinds, toKind)
	);
}
