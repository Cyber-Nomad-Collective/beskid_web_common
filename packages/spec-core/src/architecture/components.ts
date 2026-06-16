import { z } from "zod";
import {
	AST_SYNTAX_FAMILIES,
	COMPILER_PIPELINE_PHASES,
	DEPENDENCY_SOURCES,
} from "./kinds.js";
import { architectureLinkSchema } from "./links.js";
import { isSyntaxKindForFamily } from "./syntax-kinds.generated.js";

const nonEmpty = z.string().trim().min(1);

const baseNodeFields = {
	id: nonEmpty,
	label: nonEmpty,
	group: z.string().optional(),
	description: z.string().optional(),
	href: z.string().optional(),
	hidden: z.boolean().optional(),
	links: z.array(architectureLinkSchema).optional(),
};

export const servicePropsSchema = z.object({
	name: nonEmpty,
	host: nonEmpty,
	port: z.number().int().positive().optional(),
	stack: z.string().optional(),
	deployEnv: z.enum(["production", "staging", "local"]).optional(),
});

export const dependencyPropsSchema = z.object({
	crate: nonEmpty,
	purpose: nonEmpty,
	source: z.enum(DEPENDENCY_SOURCES),
	vendored: z.boolean().optional(),
});

export const compilerPipelineStagePropsSchema = z.object({
	crate: nonEmpty,
	entry: nonEmpty,
	phase: z.enum(COMPILER_PIPELINE_PHASES),
});

export const rustModulePropsSchema = z.object({
	crate: nonEmpty,
	modulePath: nonEmpty,
	visibility: z.enum(["pub", "pub(crate)", "private"]).optional(),
});

export const beskidProjectPropsSchema = z.object({
	manifestPath: nonEmpty,
	targetKind: z.string().optional(),
});

export const beskidWorkspacePropsSchema = z.object({
	manifestPath: nonEmpty,
	root: z.string().optional(),
});

export const specNodePropsSchema = z.object({
	slug: nonEmpty,
	specLevel: z
		.enum(["domain", "area", "feature", "article", "adr", "root"])
		.optional(),
});

export const astSyntaxNodePropsSchema = z
	.object({
		family: z.enum(AST_SYNTAX_FAMILIES),
		syntaxKind: nonEmpty,
	})
	.superRefine((val, ctx) => {
		if (!isSyntaxKindForFamily(val.family, val.syntaxKind)) {
			ctx.addIssue({
				code: "custom",
				message: `syntaxKind "${val.syntaxKind}" is not valid for family ${val.family}`,
				path: ["syntaxKind"],
			});
		}
	});

export const groupPropsSchema = z.object({}).optional().default({});

export const serviceNodeSchema = z.object({
	...baseNodeFields,
	kind: z.literal("service"),
	props: servicePropsSchema,
});

export const dependencyNodeSchema = z.object({
	...baseNodeFields,
	kind: z.literal("dependency"),
	props: dependencyPropsSchema,
});

export const compilerPipelineStageNodeSchema = z.object({
	...baseNodeFields,
	kind: z.literal("compilerPipelineStage"),
	props: compilerPipelineStagePropsSchema,
});

export const rustModuleNodeSchema = z.object({
	...baseNodeFields,
	kind: z.literal("rustModule"),
	props: rustModulePropsSchema,
});

export const beskidProjectNodeSchema = z.object({
	...baseNodeFields,
	kind: z.literal("beskidProject"),
	props: beskidProjectPropsSchema,
});

export const beskidWorkspaceNodeSchema = z.object({
	...baseNodeFields,
	kind: z.literal("beskidWorkspace"),
	props: beskidWorkspacePropsSchema,
});

export const specNodeComponentSchema = z.object({
	...baseNodeFields,
	kind: z.literal("specNode"),
	props: specNodePropsSchema,
});

export const astSyntaxNodeSchema = z.object({
	...baseNodeFields,
	kind: z.literal("astSyntaxNode"),
	props: astSyntaxNodePropsSchema,
});

export const groupNodeSchema = z.object({
	...baseNodeFields,
	kind: z.literal("group"),
	props: groupPropsSchema,
});

export const architectureComponentSchema = z.discriminatedUnion("kind", [
	serviceNodeSchema,
	dependencyNodeSchema,
	compilerPipelineStageNodeSchema,
	rustModuleNodeSchema,
	beskidProjectNodeSchema,
	beskidWorkspaceNodeSchema,
	specNodeComponentSchema,
	astSyntaxNodeSchema,
	groupNodeSchema,
]);

export type ArchitectureComponent = z.infer<typeof architectureComponentSchema>;
export type ServiceProps = z.infer<typeof servicePropsSchema>;
export type DependencyProps = z.infer<typeof dependencyPropsSchema>;
export type CompilerPipelineStageProps = z.infer<
	typeof compilerPipelineStagePropsSchema
>;

export function parseArchitectureComponent(
	raw: unknown,
	context = "node",
): ArchitectureComponent {
	const parsed = architectureComponentSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid architecture component — ${msg}`);
	}
	return parsed.data;
}
