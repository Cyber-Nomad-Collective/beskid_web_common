import { md } from "@markschema/mdshape";
import type { SpecLevel } from "./workspace/schema.js";

const adrBodySchema = md.document({
	context: md.section("Context").paragraph().min(1),
	decision: md.section("Decision").paragraph().min(1),
	consequences: md.section("Consequences").paragraph().min(1),
});

const featureHubBodySchema = md.document({
	summary: md.section("Summary").paragraph().optional(),
});

const articleBodySchema = md.document({
	summary: md.section("Summary").paragraph().optional(),
	details: md.section("Details").paragraph().optional(),
});

const domainBodySchema = md.document({
	overview: md.section("Overview").paragraph().optional(),
	scope: md.section("Scope").paragraph().optional(),
});

const areaBodySchema = md.document({
	overview: md.section("Overview").paragraph().optional(),
});

const BODY_SCHEMAS: Partial<Record<SpecLevel, ReturnType<typeof md.document>>> = {
	root: domainBodySchema,
	domain: domainBodySchema,
	area: areaBodySchema,
	feature: featureHubBodySchema,
	article: articleBodySchema,
	adr: adrBodySchema,
};

export interface MdshapeValidationIssue {
	code: string;
	message: string;
	path?: string;
}

export function validateBodyWithMdshape(
	specLevel: SpecLevel,
	body: string,
): MdshapeValidationIssue[] {
	const schema = BODY_SCHEMAS[specLevel];
	if (!schema) return [];

	const result = schema.safeParse(body.trim() ? body : "\n");
	if (result.success) return [];

	return result.error.issues.map((issue) => ({
		code: "mdshape-body",
		message: issue.message,
		path: issue.path?.join(".") || undefined,
	}));
}

export { adrBodySchema, featureHubBodySchema };
