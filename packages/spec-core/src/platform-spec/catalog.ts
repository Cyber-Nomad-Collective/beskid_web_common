/**
 * Catalog schema + codec, ported from trudoc/src/platform-spec/catalog.ts.
 * Replaces platform-spec + tracker imports of @cyber-nomad-collective/trudoc/platform-spec/catalog.
 */
import { z } from "zod";

const catalogEntrySchema = z.object({
	slug: z.string().min(1),
	href: z.string().min(1),
	pathClass: z.string().min(1),
	specLevel: z.string().nullable(),
	title: z.string().min(1),
	description: z.string().nullable(),
	status: z.string().nullable(),
	adrId: z.string().nullable(),
	adrStatus: z.string().nullable(),
	repoPath: z.string().min(1),
	contentPath: z.string().min(1),
	parentSlug: z.string().nullable(),
	hasLayoutJson: z.boolean(),
});

const catalogFileSchema = z.object({
	generatedAt: z.string().min(1),
	entries: z.array(catalogEntrySchema),
});

const documentBundleSchema = z.object({
	generatedAt: z.string().min(1),
	slug: z.string().min(1),
	repoPath: z.string().min(1),
	frontmatter: z.record(z.string(), z.unknown()),
	body: z.string(),
	layoutJson: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type PlatformSpecCatalogEntry = z.infer<typeof catalogEntrySchema>;
export type PlatformSpecDocumentBundle = z.infer<typeof documentBundleSchema>;

export interface PlatformSpecCatalogFile {
	generatedAt: string;
	entries: PlatformSpecCatalogEntry[];
}

export function encodeCatalogDocSlug(slug: string): string {
	return slug.replace(/\//g, "--");
}

export function decodeCatalogDocSlug(encoded: string): string {
	return encoded.replace(/--/g, "/");
}

export function parseCatalogFile(raw: unknown): PlatformSpecCatalogFile {
	return catalogFileSchema.parse(raw);
}

export function parseDocumentBundle(
	raw: unknown,
): PlatformSpecDocumentBundle {
	return documentBundleSchema.parse(raw);
}
