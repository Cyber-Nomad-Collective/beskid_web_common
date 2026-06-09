import { layoutPresetKeySchema } from "@cyber-nomad-collective/trudoc/layout";
import { z } from "zod";
import { DEFAULT_SPEC_CONTENT_ROOT, DEFAULT_SPEC_ORIGIN } from "../constants.js";

export const specLevelSchema = z.enum([
	"root",
	"domain",
	"area",
	"feature",
	"article",
	"adr",
]);

export type SpecLevel = z.infer<typeof specLevelSchema>;

export const nodeTypeRegistrationSchema = z.object({
	label: z.string().min(1).optional(),
	extendsLayout: layoutPresetKeySchema,
	childLevels: z.array(specLevelSchema).optional(),
	contentSections: z.array(z.string().min(1)).optional(),
	adrRequired: z.boolean().optional(),
});

export type NodeTypeRegistration = z.infer<typeof nodeTypeRegistrationSchema>;

export const widgetTypeRegistrationSchema = z.object({
	description: z.string().optional(),
	defaultGrid: z
		.object({
			w: z.number().int().positive(),
			h: z.number().int().positive(),
			minW: z.number().int().positive().optional(),
			minH: z.number().int().positive().optional(),
		})
		.optional(),
});

export type WidgetTypeRegistration = z.infer<typeof widgetTypeRegistrationSchema>;

export const workspaceManifestSchema = z.object({
	version: z.literal(1),
	origin: z.string().url().default(DEFAULT_SPEC_ORIGIN),
	contentRoot: z.string().min(1).default(DEFAULT_SPEC_CONTENT_ROOT),
	nodeTypes: z.record(z.string(), nodeTypeRegistrationSchema),
	widgetTypes: z.record(z.string(), widgetTypeRegistrationSchema).optional(),
	architectureGraphs: z.array(z.string().min(1)).optional(),
	github: z
		.object({
			owner: z.string().min(1),
			repo: z.string().min(1),
			defaultBranch: z.string().min(1).default("main"),
		})
		.optional(),
});

export type WorkspaceManifest = z.infer<typeof workspaceManifestSchema>;

export const DEFAULT_WORKSPACE_MANIFEST: WorkspaceManifest = {
	version: 1,
	origin: DEFAULT_SPEC_ORIGIN,
	contentRoot: DEFAULT_SPEC_CONTENT_ROOT,
	nodeTypes: {
		root: { extendsLayout: "root-default", childLevels: ["domain"] },
		domain: {
			extendsLayout: "domain-default",
			childLevels: ["area", "domain"],
		},
		area: {
			extendsLayout: "area-default",
			childLevels: ["feature", "area"],
		},
		feature: {
			extendsLayout: "feature-hub-default",
			childLevels: ["article", "adr", "feature"],
		},
		article: { extendsLayout: "article-default" },
		adr: { extendsLayout: "article-default" },
	},
	widgetTypes: {
		domainTiles: {
			description: "Grid of child domain/area tiles",
			defaultGrid: { w: 12, h: 4, minW: 4, minH: 2 },
		},
		specSection: {
			description: "Normative spec section block",
			defaultGrid: { w: 12, h: 3, minW: 4, minH: 2 },
		},
		markdownProse: {
			description: "Markdown prose block",
			defaultGrid: { w: 12, h: 4, minW: 4, minH: 2 },
		},
		twoColumn: {
			description: "Two-column widget layout",
			defaultGrid: { w: 12, h: 4, minW: 6, minH: 2 },
		},
	},
};

export function parseWorkspaceManifest(
	raw: unknown,
	context = "spec.json",
): WorkspaceManifest {
	const parsed = workspaceManifestSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid workspace manifest — ${msg}`);
	}
	return parsed.data;
}
