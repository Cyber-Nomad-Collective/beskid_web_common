import fs from "node:fs";
import path from "node:path";
import {
	SPEC_COMMENTS_FILE,
	SPEC_CONTENT_FILE,
	SPEC_LAYOUT_FILE,
	SPEC_MARKDOWN_FILE,
	SPEC_NODE_FILE,
	SPEC_WORKSPACE_MANIFEST,
} from "./constants.js";
import { parseNodeComments } from "./comments/schema.js";
import { parseNodeContent } from "./content/schema.js";
import { parseLayoutFile } from "./grid-layout.js";
import {
	readNodeMarkdown,
	validateMarkdownContent,
} from "./markdown-content.js";
import { parseNodeMetadata } from "./node/schema.js";
import { slugFromNodeDir } from "./path-rules.js";
import {
	DEFAULT_WORKSPACE_MANIFEST,
	parseWorkspaceManifest,
	type SpecLevel,
	type WorkspaceManifest,
} from "./workspace/schema.js";
import { createSpecNode, defaultManifestForNormativeRepo } from "./scaffold-node.js";

export interface ValidationIssue {
	code: string;
	severity: "error" | "warning";
	path: string;
	message: string;
}

export interface ValidationReport {
	ok: boolean;
	issues: ValidationIssue[];
	nodeCount: number;
}

function collectNodeDirs(contentRoot: string): string[] {
	const dirs: string[] = [];
	if (!fs.existsSync(contentRoot)) return dirs;

	function walk(dir: string) {
		const nodeJson = path.join(dir, SPEC_NODE_FILE);
		if (fs.existsSync(nodeJson)) {
			dirs.push(dir);
		}
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory() && !entry.name.startsWith(".")) {
				walk(path.join(dir, entry.name));
			}
		}
	}

	walk(contentRoot);
	return dirs;
}

function allowedChildLevels(
	manifest: WorkspaceManifest,
	parentLevel: SpecLevel,
): SpecLevel[] | undefined {
	return manifest.nodeTypes[parentLevel]?.childLevels;
}

export function validateWorkspace(workspaceDir: string): ValidationReport {
	const issues: ValidationIssue[] = [];
	const manifestPath = path.join(workspaceDir, SPEC_WORKSPACE_MANIFEST);
	let manifest: WorkspaceManifest;

	if (!fs.existsSync(manifestPath)) {
		return {
			ok: false,
			issues: [
				{
					code: "missing-manifest",
					severity: "error",
					path: manifestPath,
					message: `Missing ${SPEC_WORKSPACE_MANIFEST}`,
				},
			],
			nodeCount: 0,
		};
	}

	try {
		manifest = parseWorkspaceManifest(
			JSON.parse(fs.readFileSync(manifestPath, "utf8")),
			manifestPath,
		);
	} catch (err) {
		return {
			ok: false,
			issues: [
				{
					code: "invalid-manifest",
					severity: "error",
					path: manifestPath,
					message: err instanceof Error ? err.message : String(err),
				},
			],
			nodeCount: 0,
		};
	}

	const contentRoot = path.join(workspaceDir, manifest.contentRoot);
	const nodeDirs = collectNodeDirs(contentRoot);
	const nodesBySlug = new Map<string, { dir: string; level: SpecLevel }>();

	for (const nodeDir of nodeDirs) {
		const rel = path.relative(workspaceDir, nodeDir);
		try {
			const node = parseNodeMetadata(
				JSON.parse(fs.readFileSync(path.join(nodeDir, SPEC_NODE_FILE), "utf8")),
				path.join(rel, SPEC_NODE_FILE),
			);
			nodesBySlug.set(node.slug, { dir: nodeDir, level: node.specLevel });

			const layoutPath = path.join(nodeDir, SPEC_LAYOUT_FILE);
			if (fs.existsSync(layoutPath)) {
				parseLayoutFile(
					JSON.parse(fs.readFileSync(layoutPath, "utf8")),
					layoutPath,
				);
			}

			const contentPath = path.join(nodeDir, SPEC_CONTENT_FILE);
			const markdownPath = path.join(nodeDir, SPEC_MARKDOWN_FILE);
			if (fs.existsSync(markdownPath)) {
				const markdown = readNodeMarkdown(nodeDir);
				for (const issue of validateMarkdownContent(
					workspaceDir,
					manifest,
					node,
					markdown,
				)) {
					issues.push({
						code: issue.code,
						severity: "error",
						path: markdownPath,
						message: issue.message,
					});
				}
			} else if (fs.existsSync(contentPath)) {
				parseNodeContent(
					JSON.parse(fs.readFileSync(contentPath, "utf8")),
					contentPath,
				);
				issues.push({
					code: "legacy-content-json",
					severity: "warning",
					path: contentPath,
					message: `Prefer ${SPEC_MARKDOWN_FILE}; run spec import-assistant --apply`,
				});
			} else {
				issues.push({
					code: "missing-content",
					severity: "error",
					path: markdownPath,
					message: `Missing ${SPEC_MARKDOWN_FILE}`,
				});
			}

			const commentsPath = path.join(nodeDir, SPEC_COMMENTS_FILE);
			if (fs.existsSync(commentsPath)) {
				parseNodeComments(
					JSON.parse(fs.readFileSync(commentsPath, "utf8")),
					commentsPath,
				);
			}

			const computedSlug = slugFromNodeDir(
				manifest.contentRoot,
				nodeDir,
				workspaceDir,
			);
			if (computedSlug !== node.slug) {
				issues.push({
					code: "slug-mismatch",
					severity: "error",
					path: path.join(rel, SPEC_NODE_FILE),
					message: `Slug ${node.slug} does not match path ${computedSlug}`,
				});
			}

			if (!manifest.nodeTypes[node.specLevel]) {
				issues.push({
					code: "unregistered-node-type",
					severity: "error",
					path: path.join(rel, SPEC_NODE_FILE),
					message: `Node type ${node.specLevel} is not registered in spec.json`,
				});
			}
		} catch (err) {
			issues.push({
				code: "parse-error",
				severity: "error",
				path: rel,
				message: err instanceof Error ? err.message : String(err),
			});
		}
	}

	for (const [slug, { level }] of nodesBySlug) {
		const node = parseNodeMetadata(
			JSON.parse(
				fs.readFileSync(
					path.join(nodesBySlug.get(slug)!.dir, SPEC_NODE_FILE),
					"utf8",
				),
			),
		);
		if (node.parentSlug) {
			const parent = nodesBySlug.get(node.parentSlug);
			if (!parent) {
				issues.push({
					code: "missing-parent",
					severity: "error",
					path: slug,
					message: `Parent slug ${node.parentSlug} not found`,
				});
				continue;
			}
			const allowed = allowedChildLevels(manifest, parent.level);
			if (allowed && !allowed.includes(level)) {
				issues.push({
					code: "invalid-nesting",
					severity: "error",
					path: slug,
					message: `${level} is not allowed under ${parent.level} (allowed: ${allowed.join(", ")})`,
				});
			}
		}
	}

	const errors = issues.filter((i) => i.severity === "error");
	return {
		ok: errors.length === 0,
		issues,
		nodeCount: nodeDirs.length,
	};
}

export function initWorkspace(
	workspaceDir: string,
	manifest: WorkspaceManifest = defaultManifestForNormativeRepo(),
): void {
	fs.mkdirSync(workspaceDir, { recursive: true });
	fs.mkdirSync(path.join(workspaceDir, manifest.contentRoot), {
		recursive: true,
	});
	fs.writeFileSync(
		path.join(workspaceDir, SPEC_WORKSPACE_MANIFEST),
		`${JSON.stringify(manifest, null, 2)}\n`,
	);

	const rootNodeDir = path.join(workspaceDir, manifest.contentRoot);
	if (!fs.existsSync(path.join(rootNodeDir, SPEC_NODE_FILE))) {
		createSpecNode({
			workspaceDir,
			typeFlag: "Root",
			slug: "platform-spec",
			title: "Platform specification",
			parentSlug: null,
			status: "published",
			manifest,
		});
	}
}

export { DEFAULT_WORKSPACE_MANIFEST, defaultManifestForNormativeRepo };
