/**
 * Frontmatter validation + form/serialization helpers, ported from
 * trudoc/src/platform-spec/docs-spec/{frontmatter,form-layouts,build-path}.ts.
 *
 * Replaces the trudoc dependency for validate-node-document.ts and
 * site/platform-spec/src/server/drafts.ts.
 */
import { stringify } from "yaml";
import type { z } from "zod";
import {
	adrSpecSchema,
	areaSpecSchema,
	articleSpecSchema,
	domainSpecSchema,
	featureSpecSchema,
	platformSpecNodeSchema,
} from "./schema.js";
import type { SpecLevel } from "../workspace/schema.js";

export function parseFrontmatterJson(json: string): Record<string, unknown> {
	try {
		const parsed = JSON.parse(json) as unknown;
		if (!parsed || typeof parsed !== "object") return {};
		return parsed as Record<string, unknown>;
	} catch {
		return {};
	}
}

export function validateFrontmatterForLevel(
	specLevel: string,
	frontmatter: Record<string, unknown>,
): { ok: true } | { ok: false; errors: string[] } {
	const schemaForLevel: Record<string, z.ZodType> = {
		domain: domainSpecSchema,
		area: areaSpecSchema,
		feature: featureSpecSchema,
		article: articleSpecSchema,
		adr: adrSpecSchema,
	};

	const schema = schemaForLevel[specLevel] ?? platformSpecNodeSchema;
	const result = schema.safeParse(frontmatter);
	if (result.success) return { ok: true };
	return {
		ok: false,
		errors: result.error.issues.map(
			(i) => `${i.path.join(".") || "frontmatter"}: ${i.message}`,
		),
	};
}

export function serializeFrontmatterYaml(
	frontmatter: Record<string, unknown>,
): string {
	return stringify(frontmatter).trimEnd();
}

export function buildMdxFile(
	frontmatter: Record<string, unknown>,
	body: string,
): string {
	const yaml = stringify(frontmatter).trimEnd();
	const normalizedBody = body.startsWith("\n") ? body : `\n${body}`;
	return `---\n${yaml}\n---${normalizedBody.endsWith("\n") ? normalizedBody : `${normalizedBody}\n`}`;
}

/**
 * Minimal frontmatter <-> form field mapping shared by tracker and platform-spec app.
 * Form field names use flat snake_case (owner_name, submitter_email, body_md, ...).
 */
export function formValuesToFrontmatter(
	specLevel: SpecLevel,
	values: Record<string, string>,
): Record<string, unknown> {
	const fm: Record<string, unknown> = {
		title: values.title?.trim(),
		description: values.description?.trim(),
		specLevel,
		owner: {
			name: values.owner_name?.trim(),
			email: values.owner_email?.trim(),
		},
		submitter: {
			name: values.submitter_name?.trim(),
			email: values.submitter_email?.trim(),
		},
	};

	if (specLevel === "feature" || specLevel === "article" || specLevel === "adr") {
		fm.status = values.status?.trim() || "Proposed";
	}

	if (specLevel === "adr") {
		fm.adrId = values.adrId?.trim();
		fm.adrStatus = values.adrStatus?.trim() || "Proposed";
		if (values.adrDate?.trim()) fm.adrDate = values.adrDate.trim();
	}

	if (values.related_topics?.trim()) {
		try {
			const topics = JSON.parse(values.related_topics) as unknown;
			if (Array.isArray(topics)) fm.relatedTopics = topics;
		} catch {
			// ignore invalid JSON
		}
	}

	return fm;
}

export function frontmatterToFormValues(
	frontmatter: Record<string, unknown>,
	bodyMd: string,
): Record<string, string> {
	const owner = frontmatter.owner as
		| { name?: string; email?: string }
		| undefined;
	const submitter = frontmatter.submitter as
		| { name?: string; email?: string }
		| undefined;

	return {
		title: String(frontmatter.title ?? ""),
		description: String(frontmatter.description ?? ""),
		status: String(frontmatter.status ?? "Proposed"),
		adrId: String(frontmatter.adrId ?? ""),
		adrStatus: String(frontmatter.adrStatus ?? "Proposed"),
		adrDate: String(frontmatter.adrDate ?? ""),
		owner_name: String(owner?.name ?? ""),
		owner_email: String(owner?.email ?? ""),
		submitter_name: String(submitter?.name ?? ""),
		submitter_email: String(submitter?.email ?? ""),
		related_topics: frontmatter.relatedTopics
			? JSON.stringify(frontmatter.relatedTopics, null, 2)
			: "[]",
		body_md: bodyMd,
	};
}
