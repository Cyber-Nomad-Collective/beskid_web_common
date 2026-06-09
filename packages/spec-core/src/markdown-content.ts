import fs from "node:fs";
import path from "node:path";
import type { NodeMetadata } from "./node/schema.js";
import {
	SPEC_ARCHITECTURE_DIR,
	SPEC_MARKDOWN_FILE,
} from "./constants.js";
import type { WorkspaceManifest } from "./workspace/schema.js";

export interface MarkdownSection {
	id: string;
	title: string;
	body: string;
}

const HEADING_RE = /^##\s+(.+)$/gm;
const ARCH_REF_RE = /\[\[arch:([a-z0-9-]+)\]\]/gi;

export const ADR_STATUSES = [
	"proposed",
	"accepted",
	"rejected",
	"superseded",
	"deprecated",
] as const;

export type AdrStatus = (typeof ADR_STATUSES)[number];

export function slugifySectionTitle(title: string): string {
	return title
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function parseMarkdownSections(markdown: string): MarkdownSection[] {
	const sections: MarkdownSection[] = [];
	const matches = [...markdown.matchAll(HEADING_RE)];

	if (matches.length === 0) {
		return [
			{
				id: "body",
				title: "Body",
				body: markdown.trim(),
			},
		];
	}

	let cursor = 0;
	for (let i = 0; i < matches.length; i += 1) {
		const match = matches[i]!;
		const title = match[1]!.trim();
		const start = match.index! + match[0].length;
		const end =
			i + 1 < matches.length ? matches[i + 1]!.index! : markdown.length;
		const preamble = markdown.slice(cursor, match.index!).trim();
		if (preamble && sections.length === 0) {
			sections.push({ id: "preamble", title: "Preamble", body: preamble });
		}
		sections.push({
			id: slugifySectionTitle(title),
			title,
			body: markdown.slice(start, end).trim(),
		});
		cursor = end;
	}

	return sections;
}

export function scaffoldMarkdownSections(sectionIds: string[]): string {
	if (sectionIds.length === 0) {
		return "# Content\n\n";
	}
	return sectionIds
		.map((id) => {
			const title = id
				.split("-")
				.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
				.join(" ");
			return `## ${title}\n\n`;
		})
		.join("\n");
}

export function extractArchitectureRefs(markdown: string): string[] {
	const refs = new Set<string>();
	for (const match of markdown.matchAll(ARCH_REF_RE)) {
		if (match[1]) refs.add(match[1].toLowerCase());
	}
	return [...refs];
}

export function listArchitectureGraphs(workspaceDir: string): string[] {
	const dir = path.join(workspaceDir, SPEC_ARCHITECTURE_DIR);
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((name) => name.endsWith(".json"))
		.map((name) => name.replace(/\.json$/, ""));
}

export interface MarkdownValidationIssue {
	code: string;
	message: string;
}

export function validateMarkdownContent(
	workspaceDir: string,
	manifest: WorkspaceManifest,
	node: NodeMetadata,
	markdown: string,
): MarkdownValidationIssue[] {
	const issues: MarkdownValidationIssue[] = [];
	const registration = manifest.nodeTypes[node.specLevel];
	const requiredSections = registration?.contentSections ?? [];
	const sections = parseMarkdownSections(markdown);
	const sectionIds = new Set(sections.map((section) => section.id));

	for (const required of requiredSections) {
		if (!sectionIds.has(required)) {
			issues.push({
				code: "missing-section",
				message: `Missing required section ## ${required.replace(/-/g, " ")} (${required})`,
			});
		}
	}

	if (node.specLevel === "adr" || registration?.adrRequired) {
		if (!node.adrId) {
			issues.push({
				code: "adr-missing-id",
				message: "ADR nodes require adrId in node.json",
			});
		}
		if (!node.adrStatus) {
			issues.push({
				code: "adr-missing-status",
				message: "ADR nodes require adrStatus in node.json",
			});
		} else if (
			!ADR_STATUSES.includes(node.adrStatus.toLowerCase() as AdrStatus)
		) {
			issues.push({
				code: "adr-invalid-status",
				message: `adrStatus must be one of: ${ADR_STATUSES.join(", ")}`,
			});
		}
		if (!node.adrDate) {
			issues.push({
				code: "adr-missing-date",
				message: "ADR nodes require adrDate (YYYY-MM-DD) in node.json",
			});
		}
	}

	const knownGraphs = new Set([
		...listArchitectureGraphs(workspaceDir),
		...(manifest.architectureGraphs ?? []).map((graph) => graph.toLowerCase()),
	]);
	for (const ref of extractArchitectureRefs(markdown)) {
		if (knownGraphs.size > 0 && !knownGraphs.has(ref)) {
			issues.push({
				code: "unknown-arch-graph",
				message: `Unknown architecture graph reference [[arch:${ref}]]`,
			});
		}
	}

	return issues;
}

export function readNodeMarkdown(nodeDir: string): string {
	const file = path.join(nodeDir, SPEC_MARKDOWN_FILE);
	if (!fs.existsSync(file)) return "";
	return fs.readFileSync(file, "utf8");
}

export function writeNodeMarkdown(nodeDir: string, markdown: string): void {
	fs.mkdirSync(nodeDir, { recursive: true });
	fs.writeFileSync(
		path.join(nodeDir, SPEC_MARKDOWN_FILE),
		markdown.endsWith("\n") ? markdown : `${markdown}\n`,
	);
}
