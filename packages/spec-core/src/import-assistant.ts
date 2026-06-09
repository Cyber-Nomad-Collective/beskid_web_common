import fs from "node:fs";
import path from "node:path";
import {
	SPEC_LAYOUT_FILE,
	SPEC_MARKDOWN_FILE,
	SPEC_NODE_FILE,
} from "./constants.js";
import { importLegacyMdxTree } from "./import-legacy-mdx.js";
import {
	parseMarkdownSections,
	readNodeMarkdown,
	writeNodeMarkdown,
} from "./markdown-content.js";
import { nodeDirFromSlug, slugFromSpecRel } from "./path-rules.js";
import type { WorkspaceManifest } from "./workspace/schema.js";

export interface ImportAssistantPlanItem {
	sourcePath: string;
	targetSlug: string;
	targetDir: string;
	kind: "mdx" | "md" | "directory";
	action: "import" | "move" | "skip";
	reason?: string;
}

export interface ImportAssistantReport {
	plan: ImportAssistantPlanItem[];
	mdxFiles: number;
	mdFiles: number;
	nodeDirs: number;
	errors: string[];
}

function walkFiles(root: string, ext: string, out: string[] = []): string[] {
	if (!fs.existsSync(root)) return out;
	for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
		const abs = path.join(root, entry.name);
		if (entry.isDirectory()) {
			walkFiles(abs, ext, out);
		} else if (entry.name.endsWith(ext)) {
			out.push(abs);
		}
	}
	return out;
}

function relSlugFromLegacyPath(absPath: string, legacyRoot: string): string {
	const rel = path.relative(legacyRoot, absPath).replace(/\\/g, "/");
	const withoutExt = rel.replace(/\/index\.(mdx|md)$/i, "").replace(/\.(mdx|md)$/i, "");
	return slugFromSpecRel(withoutExt.startsWith("platform-spec/") ? withoutExt : `platform-spec/${withoutExt}`);
}

export function analyzeImportAssistant(input: {
	legacyRoot: string;
	workspaceDir: string;
	manifest: WorkspaceManifest;
}): ImportAssistantReport {
	const plan: ImportAssistantPlanItem[] = [];
	const errors: string[] = [];
	const contentRoot = path.join(input.workspaceDir, input.manifest.contentRoot);

	const mdxFiles = walkFiles(input.legacyRoot, ".mdx");
	const mdFiles = walkFiles(input.legacyRoot, ".md");
	const nodeDirs = fs.existsSync(contentRoot)
		? fs
				.readdirSync(contentRoot, { recursive: true, withFileTypes: true })
				.filter(
					(entry) =>
						entry.isFile() &&
						entry.name === SPEC_NODE_FILE &&
						entry.parentPath != null,
				)
				.map((entry) => path.dirname(path.join(entry.parentPath, entry.name)))
		: [];

	for (const file of [...mdxFiles, ...mdFiles]) {
		const kind = file.endsWith(".mdx") ? "mdx" : "md";
		const targetSlug = relSlugFromLegacyPath(file, input.legacyRoot);
		const targetDir = path.join(
			input.workspaceDir,
			nodeDirFromSlug(input.manifest.contentRoot, targetSlug),
		);
		const hasNode = fs.existsSync(path.join(targetDir, SPEC_NODE_FILE));
		plan.push({
			sourcePath: file,
			targetSlug,
			targetDir,
			kind,
			action: hasNode ? "skip" : "import",
			reason: hasNode ? "Target node already exists" : undefined,
		});
	}

	for (const nodeDir of nodeDirs) {
		const rel = path.relative(contentRoot, nodeDir).replace(/\\/g, "/");
		const slug = rel ? `platform-spec/${rel}` : "platform-spec";
		const hasMarkdown = fs.existsSync(path.join(nodeDir, SPEC_MARKDOWN_FILE));
		if (!hasMarkdown && fs.existsSync(path.join(nodeDir, "content.json"))) {
			plan.push({
				sourcePath: nodeDir,
				targetSlug: slug,
				targetDir: nodeDir,
				kind: "directory",
				action: "move",
				reason: "Convert legacy content.json to content.md",
			});
		}
	}

	return {
		plan,
		mdxFiles: mdxFiles.length,
		mdFiles: mdFiles.length,
		nodeDirs: nodeDirs.length,
		errors,
	};
}

export function applyImportAssistant(input: {
	legacyRoot: string;
	workspaceDir: string;
	manifest: WorkspaceManifest;
	dryRun?: boolean;
}): ImportAssistantReport {
	const report = analyzeImportAssistant(input);
	if (input.dryRun) return report;

	const importResult = importLegacyMdxTree({
		mdxRoot: input.legacyRoot,
		outputRoot: input.workspaceDir,
		manifest: input.manifest,
	});
	report.errors.push(...importResult.errors);

	for (const item of report.plan) {
		if (item.action !== "move" || item.kind !== "directory") continue;
		const contentJson = path.join(item.targetDir, "content.json");
		if (!fs.existsSync(contentJson)) continue;
		try {
			const parsed = JSON.parse(fs.readFileSync(contentJson, "utf8")) as {
				blocks?: Array<{ type: string; bodyMd?: string; id?: string; title?: string }>;
			};
			const parts: string[] = [];
			for (const block of parsed.blocks ?? []) {
				if (block.type === "specSection" && block.id) {
					const title =
						block.title ??
						block.id
							.split("-")
							.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
							.join(" ");
					parts.push(`## ${title}\n\n${block.bodyMd ?? ""}`.trim());
				} else if (block.type === "markdownProse") {
					parts.push(block.bodyMd ?? "");
				}
			}
			writeNodeMarkdown(item.targetDir, `${parts.join("\n\n")}\n`);
		} catch (err) {
			report.errors.push(
				`${item.targetDir}: ${err instanceof Error ? err.message : String(err)}`,
			);
			continue;
		}

		const existingMd = readNodeMarkdown(item.targetDir);
		if (existingMd.trim()) {
			const mergedSections = parseMarkdownSections(existingMd);
			writeNodeMarkdown(
				item.targetDir,
				mergedSections
					.map((section) => `## ${section.title}\n\n${section.body}`.trim())
					.join("\n\n") + "\n",
			);
		}
	}

	return report;
}
