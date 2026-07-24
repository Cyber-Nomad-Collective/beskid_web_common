import {
	type PlatformSpecContentIssue,
	verifyPlatformSpecContent,
} from "./platform-spec-content";
import {
	collectPlatformSpecFrontmatterIssues,
	type PlatformSpecFrontmatterIssue,
} from "./platform-spec-frontmatter";

export type ProposalWorkspaceVerifyIssue = {
	code: string;
	severity: "error" | "warn";
	file: string;
	message: string;
	source: string;
};

export type ProposalWorkspaceVerifyOptions = {
	websiteRoot: string;
	changedRelPaths: string[];
};

function normalizeSpecRel(rel: string): string {
	return rel.replace(/\\/g, "/").replace(/^\//, "");
}

function toVerifyIssue(
	issue: PlatformSpecFrontmatterIssue | PlatformSpecContentIssue,
	source: string,
): ProposalWorkspaceVerifyIssue {
	return {
		code: issue.code,
		severity: issue.severity,
		file: normalizeSpecRel(issue.file),
		message: issue.message,
		source,
	};
}

/** Validate a materialized proposal workspace (changed platform-spec paths only). */
export function verifyProposalWorkspace(
	options: ProposalWorkspaceVerifyOptions,
): { ok: boolean; issues: ProposalWorkspaceVerifyIssue[] } {
	const filter = new Set(options.changedRelPaths.map(normalizeSpecRel));

	const frontmatter = collectPlatformSpecFrontmatterIssues(
		options.websiteRoot,
		filter,
	).map((issue) => toVerifyIssue(issue, "frontmatter"));

	const content = verifyPlatformSpecContent({
		websiteRoot: options.websiteRoot,
	})
		.filter((issue) => filter.has(normalizeSpecRel(issue.file)))
		.map((issue) => toVerifyIssue(issue, "platform-spec-content"));

	const issues = [...frontmatter, ...content];
	const ok = !issues.some((issue) => issue.severity === "error");
	return { ok, issues };
}
