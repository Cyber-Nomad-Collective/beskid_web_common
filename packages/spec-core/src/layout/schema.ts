/**
 * Layout zod schemas, ported from trudoc/src/layout/schema.ts.
 * Replaces spec-core imports of @cyber-nomad-collective/trudoc/layout.
 */
import { z } from "zod";

/** Declared in each node's `layout.json` (and root). */
export const layoutLevelSchema = z.enum([
	"root",
	"domain",
	"area",
	"component",
	"feature",
	"article",
]);

export type LayoutLevel = z.infer<typeof layoutLevelSchema>;

/** Built-in preset keys resolved in code (DRY defaults). */
export const layoutPresetKeySchema = z.enum([
	"root-default",
	"domain-default",
	"area-default",
	"area-sparse",
	"feature-contract-default",
	"feature-hub-default",
	"feature-area-hub-default",
	"article-default",
]);

export type LayoutPresetKey = z.infer<typeof layoutPresetKeySchema>;

/** Classifies a platform-spec doc path segment layout (no Node deps — safe for client bundles). */
export type PathClass =
	| "domain-root"
	| "domain"
	| "area"
	| "feature"
	| "article"
	| "adr"
	| "component"
	| "legacy-or-bridge";

const sectionRuleSchema = z.object({
	id: z.string().min(1),
	required: z.boolean().default(true),
	kind: z.enum(["specSection", "markdownHeading"]).default("specSection"),
});

export type SectionRule = z.infer<typeof sectionRuleSchema>;

export const documentStructureStepSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("specSection"),
		id: z.string().min(1),
		required: z.boolean().default(true),
	}),
	z.object({
		kind: z.literal("markdownHeading"),
		slug: z.string().min(1),
		required: z.boolean().default(true),
	}),
	z.object({
		kind: z.literal("component"),
		name: z.string().min(1),
		required: z.boolean().default(false),
	}),
]);

export type DocumentStructureStep = z.infer<typeof documentStructureStepSchema>;

export const documentStructureSchema = z.object({
	orderedSpecSectionIds: z.array(z.string().min(1)).optional(),
	orderedSequence: z.array(documentStructureStepSchema).optional(),
});

export type DocumentStructure = z.infer<typeof documentStructureSchema>;

export const childArticlesConstraintSchema = z.object({
	minDirectArticles: z.number().int().nonnegative().optional(),
	requireYamlTitle: z.boolean().optional(),
});

export type ChildArticlesConstraint = z.infer<
	typeof childArticlesConstraintSchema
>;

const domainTilesPropsSchema = z.object({
	pathPrefix: z.string().min(1),
	heading: z.string().default("Explore"),
});

const twoColumnPropsSchema = z.object({
	gap: z.enum(["sm", "md", "lg"]).default("md"),
	left: z.array(
		z.object({ type: z.literal("domainTiles"), props: domainTilesPropsSchema }),
	),
	right: z.array(
		z.object({ type: z.literal("domainTiles"), props: domainTilesPropsSchema }),
	),
});

export const widgetSpecSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("domainTiles"),
		props: domainTilesPropsSchema,
	}),
	z.object({
		type: z.literal("twoColumn"),
		props: twoColumnPropsSchema,
	}),
]);

export type WidgetSpec = z.infer<typeof widgetSpecSchema>;
export type TwoColumnProps = z.infer<typeof twoColumnPropsSchema>;

export const articleDefaultsSchema = z.object({
	extends: layoutPresetKeySchema.optional(),
	sections: z.array(sectionRuleSchema).optional(),
	minSpecSections: z.number().int().nonnegative().optional(),
	minMarkdownHeadings: z.number().int().nonnegative().optional(),
	widgets: z.array(widgetSpecSchema).optional(),
	documentStructure: documentStructureSchema.optional(),
});

export type ArticleDefaults = z.infer<typeof articleDefaultsSchema>;

export const layoutContractFileSchema = z.object({
	version: z.literal(1),
	level: layoutLevelSchema,
	extends: layoutPresetKeySchema.optional(),
	sections: z.array(sectionRuleSchema).optional(),
	minSpecSections: z.number().int().nonnegative().optional(),
	minMarkdownHeadings: z.number().int().nonnegative().optional(),
	widgets: z.array(widgetSpecSchema).optional(),
	pathPrefix: z.string().optional(),
	tilesHeading: z.string().optional(),
	articleDefaults: articleDefaultsSchema.optional(),
	documentStructure: documentStructureSchema.optional(),
	childArticles: childArticlesConstraintSchema.optional(),
	validators: z.record(z.string(), z.unknown()).optional(),
});

export type LayoutContractFile = z.infer<typeof layoutContractFileSchema>;

export const effectiveLayoutSchema = layoutContractFileSchema.extend({
	extends: layoutPresetKeySchema.optional(),
	effectiveSections: z.array(sectionRuleSchema),
	effectiveMinSpecSections: z.number().int().nonnegative().optional(),
	effectiveMinMarkdownHeadings: z.number().int().nonnegative().optional(),
	effectiveWidgets: z.array(widgetSpecSchema),
	effectiveDocumentStructure: documentStructureSchema.optional(),
	effectiveChildArticles: childArticlesConstraintSchema.optional(),
});

export type EffectiveLayout = z.infer<typeof effectiveLayoutSchema>;

export const layoutTreeNodeSchema = z.object({
	slug: z.string(),
	contentPath: z.string(),
	level: layoutLevelSchema,
	layoutPath: z.string().nullable(),
	rawLayout: layoutContractFileSchema.optional(),
	effective: effectiveLayoutSchema,
});

export type LayoutTreeNode = z.infer<typeof layoutTreeNodeSchema>;

export const diagnosticSchema = z.object({
	code: z.string(),
	severity: z.enum(["error", "warning", "info"]),
	slug: z.string(),
	message: z.string(),
	detail: z.string().optional(),
});

export type LayoutDiagnostic = z.infer<typeof diagnosticSchema>;

export const completenessReportSchema = z.object({
	generatedAt: z.string(),
	summary: z.object({
		nodes: z.number().int(),
		errors: z.number().int(),
		warnings: z.number().int(),
	}),
	nodes: z.array(
		z.object({
			slug: z.string(),
			level: layoutLevelSchema,
			status: z.enum(["ok", "warn", "fail"]),
			sections: z.array(
				z.object({
					id: z.string(),
					required: z.boolean(),
					found: z.boolean(),
				}),
			),
			counts: z.object({
				specSections: z.number().int(),
				markdownH2: z.number().int(),
			}),
			messages: z.array(diagnosticSchema),
		}),
	),
	diagnostics: z.array(diagnosticSchema),
});

export type CompletenessReport = z.infer<typeof completenessReportSchema>;

export function parseLayoutContractJson(
	raw: unknown,
	context: string,
): LayoutContractFile {
	const parsed = layoutContractFileSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid layout.json — ${msg}`);
	}
	return parsed.data;
}
