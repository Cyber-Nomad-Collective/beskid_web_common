/**
 * Frontmatter zod schemas, ported from trudoc/src/schema/content.ts.
 * Replaces the spec-core dependency on @cyber-nomad-collective/trudoc/platform-spec/docs-spec.
 *
 * Discriminated by `specLevel`. domain/area forbid `status`; feature/article/adr require it.
 */
import { z } from "zod";
import { architectureGraphAttachmentSchema } from "../architecture/schema.js";

const nonEmptyString = z.string().trim().min(1);

export const specPersonSchema = z.object({
	name: nonEmptyString,
	email: z.string().trim().email(),
});

export type SpecPerson = z.infer<typeof specPersonSchema>;

/**
 * Stricter related-topic schema for frontmatter (enum type + blocker + severity).
 * The related.json file schema (related/schema.ts) is looser; this is the
 * authoritative frontmatter shape ported from trudoc.
 */
export const frontmatterRelatedTopicSchema = z.object({
	type: z.enum(["Domain", "Area", "Feature", "ADR", "Article"]),
	title: nonEmptyString,
	href: nonEmptyString,
	relation: nonEmptyString.optional(),
	blocker: z.boolean().optional(),
	severity: z
		.enum(["informational", "low", "medium", "high", "critical"])
		.optional(),
});

export type FrontmatterRelatedTopic = z.infer<
	typeof frontmatterRelatedTopicSchema
>;

export const platformSpecStatusSchema = z.enum([
	"Standard",
	"Proposed",
	"Superseded",
]);

export type PlatformSpecStatus = z.infer<typeof platformSpecStatusSchema>;

export const platformSpecBaseSchema = z.object({
	owner: specPersonSchema,
	submitter: specPersonSchema,
	replacement: nonEmptyString.optional(),
	lastReviewed: z.union([z.string(), z.date()]).optional(),
	canonicalSlug: nonEmptyString.optional(),
	supersedes: nonEmptyString.optional(),
	relatedTopics: z.array(frontmatterRelatedTopicSchema).optional(),
	architectureGraph: architectureGraphAttachmentSchema.optional(),
});

export type PlatformSpecBase = z.infer<typeof platformSpecBaseSchema>;

export const domainSpecSchema = platformSpecBaseSchema.extend({
	specLevel: z.literal("domain"),
	status: z.undefined().optional(),
});

export const areaSpecSchema = platformSpecBaseSchema.extend({
	specLevel: z.literal("area"),
	status: z.undefined().optional(),
});

export const featureSpecSchema = platformSpecBaseSchema.extend({
	specLevel: z.literal("feature"),
	status: platformSpecStatusSchema,
});

export const articleSpecSchema = platformSpecBaseSchema.extend({
	specLevel: z.literal("article"),
	status: platformSpecStatusSchema,
});

export const adrSpecSchema = platformSpecBaseSchema.extend({
	specLevel: z.literal("adr"),
	status: platformSpecStatusSchema,
	adrId: nonEmptyString,
	adrStatus: z.enum(["Accepted", "Superseded", "Proposed"]),
	adrDate: z.union([z.string(), z.date()]).optional(),
	supersedesAdr: nonEmptyString.optional(),
});

export const platformSpecNodeSchema = z.discriminatedUnion("specLevel", [
	domainSpecSchema,
	areaSpecSchema,
	featureSpecSchema,
	articleSpecSchema,
	adrSpecSchema,
]);

export type PlatformSpecNode = z.infer<typeof platformSpecNodeSchema>;

export type DomainSpec = z.infer<typeof domainSpecSchema>;
export type AreaSpec = z.infer<typeof areaSpecSchema>;
export type FeatureSpec = z.infer<typeof featureSpecSchema>;
export type ArticleSpec = z.infer<typeof articleSpecSchema>;
export type AdrSpec = z.infer<typeof adrSpecSchema>;
