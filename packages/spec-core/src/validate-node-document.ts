import type { NodeMetadata } from "./node/schema.js";
import { validateFrontmatterForLevel } from "./frontmatter/validate.js";
import { validateBodyWithMdshape } from "./mdshape-schemas.js";
import {
	extractArchitectureRefs,
	listArchitectureGraphs,
	ADR_STATUSES,
	type MarkdownValidationIssue,
} from "./markdown-content.js";
import {
	GENERATE_ADR_INDEX_CLOSE,
	GENERATE_ADR_INDEX_OPEN,
	GENERATE_ARTICLE_INDEX_CLOSE,
	GENERATE_ARTICLE_INDEX_OPEN,
	renderAdrIndexSummary,
	renderArticleIndex,
	stripGeneratedRegions,
	validateGeneratedRegions,
} from "./generate-hub-sections.js";
import {
	listHubChildAdrs,
	listHubChildArticles,
} from "./template-resolve.js";
import type { SpecLevel, WorkspaceManifest } from "./workspace/schema.js";

export type DocumentValidationSeverity = "error" | "warning";

export interface DocumentValidationIssue extends MarkdownValidationIssue {
	severity: DocumentValidationSeverity;
}

function regionInner(body: string, open: string, close: string): string | null {
	const re = new RegExp(
		`${open.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\s\\S]*?)${close.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
		"m",
	);
	const match = body.match(re);
	return match ? match[1]!.trim() : null;
}

function validateGeneratedRegionFreshness(input: {
	body: string;
	hubDir: string;
}): MarkdownValidationIssue[] {
	const issues: MarkdownValidationIssue[] = [];
	const adrs = listHubChildAdrs(input.hubDir);
	const articles = listHubChildArticles(input.hubDir);

	const expectedAdr = renderAdrIndexSummary(adrs);
	const actualAdr = regionInner(
		input.body,
		GENERATE_ADR_INDEX_OPEN,
		GENERATE_ADR_INDEX_CLOSE,
	);
	if (actualAdr !== null && actualAdr !== expectedAdr) {
		issues.push({
			code: "stale-generated-region",
			message:
				"Stale adr-index generated region — run spec sync to refresh from adr/",
		});
	}

	const expectedArticles = renderArticleIndex(articles);
	const actualArticles = regionInner(
		input.body,
		GENERATE_ARTICLE_INDEX_OPEN,
		GENERATE_ARTICLE_INDEX_CLOSE,
	);
	if (actualArticles !== null && actualArticles !== expectedArticles) {
		issues.push({
			code: "stale-generated-region",
			message:
				"Stale article-index generated region — run spec sync to refresh from articles/",
		});
	}

	return issues;
}

function frontmatterIssueSeverity(message: string): DocumentValidationSeverity {
	if (
		message.includes("owner:") ||
		message.includes("submitter:") ||
		message.includes("status:")
	) {
		return "warning";
	}
	return "error";
}

function bodyIssueSeverity(
	specLevel: SpecLevel,
	code: string,
	message: string,
): DocumentValidationSeverity {
	if (code !== "mdshape-body") return "error";
	if (specLevel === "adr") {
		if (
			message.includes("Context") ||
			message.includes("Decision") ||
			message.includes("Consequences")
		) {
			return "warning";
		}
	}
	return "warning";
}

export function validateNodeDocumentContent(input: {
	workspaceDir: string;
	manifest: WorkspaceManifest;
	node: NodeMetadata;
	frontmatter: Record<string, unknown>;
	body: string;
	markdownPath: string;
	nodeDir?: string;
}): DocumentValidationIssue[] {
	const issues: DocumentValidationIssue[] = [];
	const fmLevel =
		input.node.specLevel === "root" ? "domain" : input.node.specLevel;

	const fmCheck = validateFrontmatterForLevel(fmLevel, {
		...input.frontmatter,
		specLevel: fmLevel,
	});
	if (!fmCheck.ok) {
		for (const message of fmCheck.errors) {
			issues.push({
				code: "invalid-frontmatter",
				message,
				severity: frontmatterIssueSeverity(message),
			});
		}
	}

	const pathLevel =
		typeof input.frontmatter.specLevel === "string"
			? input.frontmatter.specLevel
			: fmLevel;
	const normalizedPathLevel =
		input.node.specLevel === "root" && pathLevel === "domain"
			? "root"
			: pathLevel;
	if (
		normalizedPathLevel !== fmLevel &&
		!(input.node.specLevel === "root" && pathLevel === "domain")
	) {
		issues.push({
			code: "spec-level-mismatch",
			message: `Frontmatter specLevel ${pathLevel} does not match path (${input.node.specLevel})`,
			severity: "error",
		});
	}

	const bodyForSchema = stripGeneratedRegions(input.body);
	for (const issue of validateBodyWithMdshape(input.node.specLevel, bodyForSchema)) {
		issues.push({
			code: issue.code,
			message: issue.message,
			severity: bodyIssueSeverity(
				input.node.specLevel,
				issue.code,
				issue.message,
			),
		});
	}

	if (input.node.specLevel === "feature") {
		for (const message of validateGeneratedRegions(input.body)) {
			issues.push({
				code: "generated-region",
				message,
				severity: "error",
			});
		}
		if (input.nodeDir) {
			for (const issue of validateGeneratedRegionFreshness({
				body: input.body,
				hubDir: input.nodeDir,
			})) {
				issues.push({ ...issue, severity: "warning" });
			}
		}
	}

	const registration = input.manifest.nodeTypes[input.node.specLevel];
	if (input.node.specLevel === "adr" || registration?.adrRequired) {
		if (!input.frontmatter.adrId) {
			issues.push({
				code: "adr-missing-id",
				message: "ADR nodes require adrId in content.md frontmatter",
				severity: "error",
			});
		}
		if (!input.frontmatter.adrStatus) {
			issues.push({
				code: "adr-missing-status",
				message: "ADR nodes require adrStatus in content.md frontmatter",
				severity: "error",
			});
		} else if (
			!ADR_STATUSES.includes(
				String(input.frontmatter.adrStatus).toLowerCase() as (typeof ADR_STATUSES)[number],
			)
		) {
			issues.push({
				code: "adr-invalid-status",
				message: `adrStatus must be one of: ${ADR_STATUSES.join(", ")}`,
				severity: "error",
			});
		}
	}

	const knownGraphs = new Set([
		...listArchitectureGraphs(input.workspaceDir),
		...(input.manifest.architectureGraphs ?? []).map((g) => g.toLowerCase()),
	]);
	for (const ref of extractArchitectureRefs(input.body)) {
		if (knownGraphs.size > 0 && !knownGraphs.has(ref)) {
			issues.push({
				code: "unknown-arch-graph",
				message: `Unknown architecture graph reference [[arch:${ref}]]`,
				severity: "warning",
			});
		}
	}

	for (const issue of validateStubContent({
		level: input.node.specLevel,
		body: input.body,
	})) {
		issues.push(issue);
	}

	return issues;
}

/**
 * Stub-content check — flags content that is below a minimum-content threshold
 * after stripping generated regions. Catches copy-pasted scaffold stubs.
 * Per the meta-spec anti-stub rule, flagged nodes SHOULD carry status: Proposed.
 */
function validateStubContent(input: {
	level: SpecLevel;
	body: string;
}): DocumentValidationIssue[] {
	const issues: DocumentValidationIssue[] = [];
	const normalizedBody = stripGeneratedRegions(input.body).trim();
	if (!normalizedBody) {
		issues.push({
			code: "stub-content",
			message: "Body is empty after stripping generated regions.",
			severity: "warning",
		});
		return issues;
	}

	/** Minimum substantive content (chars) before a node is considered a stub. */
	const MIN_BODY_CHARS = input.level === "article" || input.level === "adr" ? 240 : 480;
	if (normalizedBody.length < MIN_BODY_CHARS) {
		issues.push({
			code: "stub-content",
			message: `Body is only ${normalizedBody.length} chars (minimum ${MIN_BODY_CHARS} for ${input.level}). Expand or set status: Proposed.`,
			severity: "warning",
		});
	}

	return issues;
}
