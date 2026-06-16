import type { NodeMetadata } from "./node/schema.js";
import { validateFrontmatterForLevel } from "@cyber-nomad-collective/trudoc/platform-spec/docs-spec";
import { validateBodyWithMdshape } from "./mdshape-schemas.js";
import {
	extractArchitectureRefs,
	listArchitectureGraphs,
	ADR_STATUSES,
	type MarkdownValidationIssue,
} from "./markdown-content.js";
import { validateGeneratedRegions } from "./generate-hub-sections.js";
import type { WorkspaceManifest } from "./workspace/schema.js";

export function validateNodeDocumentContent(input: {
	workspaceDir: string;
	manifest: WorkspaceManifest;
	node: NodeMetadata;
	frontmatter: Record<string, unknown>;
	body: string;
	markdownPath: string;
}): MarkdownValidationIssue[] {
	const issues: MarkdownValidationIssue[] = [];
	const fmLevel =
		input.node.specLevel === "root" ? "domain" : input.node.specLevel;

	const fmCheck = validateFrontmatterForLevel(fmLevel, {
		...input.frontmatter,
		specLevel: fmLevel,
	});
	if (!fmCheck.ok) {
		for (const message of fmCheck.errors) {
			issues.push({ code: "invalid-frontmatter", message });
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
		});
	}

	for (const issue of validateBodyWithMdshape(input.node.specLevel, input.body)) {
		issues.push({ code: issue.code, message: issue.message });
	}

	if (input.node.specLevel === "feature") {
		for (const message of validateGeneratedRegions(input.body)) {
			issues.push({ code: "generated-region", message });
		}
	}

	const registration = input.manifest.nodeTypes[input.node.specLevel];
	if (input.node.specLevel === "adr" || registration?.adrRequired) {
		if (!input.frontmatter.adrId) {
			issues.push({
				code: "adr-missing-id",
				message: "ADR nodes require adrId in content.md frontmatter",
			});
		}
		if (!input.frontmatter.adrStatus) {
			issues.push({
				code: "adr-missing-status",
				message: "ADR nodes require adrStatus in content.md frontmatter",
			});
		} else if (
			!ADR_STATUSES.includes(
				String(input.frontmatter.adrStatus).toLowerCase() as (typeof ADR_STATUSES)[number],
			)
		) {
			issues.push({
				code: "adr-invalid-status",
				message: `adrStatus must be one of: ${ADR_STATUSES.join(", ")}`,
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
			});
		}
	}

	return issues;
}
