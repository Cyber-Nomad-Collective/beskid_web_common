import fs from "node:fs";
import path from "node:path";
import {
	SPEC_COMMENTS_FILE,
	SPEC_CONTENT_FILE,
	SPEC_LAYOUT_FILE,
	SPEC_MARKDOWN_FILE,
	SPEC_NODE_FILE,
	SPEC_RELATED_FILE,
	SPEC_WORKSPACE_MANIFEST,
} from "./constants.js";
import { parseNodeComments } from "./comments/schema.js";
import { parseLayoutFile } from "./grid-layout.js";
import {
	collectContentNodeDirs,
	parseNodeDocument,
} from "./node-document.js";
import { parseRelatedFile } from "./related/schema.js";
import {
	DEFAULT_WORKSPACE_MANIFEST,
	parseWorkspaceManifest,
	type SpecLevel,
	type WorkspaceManifest,
} from "./workspace/schema.js";
import { createSpecNode, defaultManifestForNormativeRepo } from "./scaffold-node.js";
import { ensureDefaultTemplates } from "./template-resolve.js";
import { validateNodeDocumentContent } from "./validate-node-document.js";
import { validateArchitectureGraphsInWorkspace } from "./architecture/validate.js";

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
	const nodeDirs = collectContentNodeDirs(contentRoot);
	const nodesBySlug = new Map<string, { dir: string; level: SpecLevel }>();

	for (const nodeDir of nodeDirs) {
		const rel = path.relative(workspaceDir, nodeDir);
		const markdownPath = path.join(nodeDir, SPEC_MARKDOWN_FILE);
		const nodeJsonPath = path.join(nodeDir, SPEC_NODE_FILE);
		const contentJsonPath = path.join(nodeDir, SPEC_CONTENT_FILE);

		if (fs.existsSync(nodeJsonPath)) {
			issues.push({
				code: "legacy-node-json",
				severity: "error",
				path: nodeJsonPath,
				message: `Remove ${SPEC_NODE_FILE}; run spec migrate v2`,
			});
		}
		if (fs.existsSync(contentJsonPath)) {
			issues.push({
				code: "legacy-content-json",
				severity: "error",
				path: contentJsonPath,
				message: `Remove ${SPEC_CONTENT_FILE}; run spec migrate v2`,
			});
		}

		try {
			const doc = parseNodeDocument({ nodeDir, workspaceDir, manifest });
			nodesBySlug.set(doc.node.slug, {
				dir: nodeDir,
				level: doc.node.specLevel,
			});

			const layoutPath = path.join(nodeDir, SPEC_LAYOUT_FILE);
			if (fs.existsSync(layoutPath)) {
				parseLayoutFile(
					JSON.parse(fs.readFileSync(layoutPath, "utf8")),
					layoutPath,
				);
			}

			for (const issue of validateNodeDocumentContent({
				workspaceDir,
				manifest,
				node: doc.node,
				frontmatter: doc.frontmatter,
				body: doc.body,
				markdownPath,
			})) {
				issues.push({
					code: issue.code,
					severity: "error",
					path: markdownPath,
					message: issue.message,
				});
			}

			const commentsPath = path.join(nodeDir, SPEC_COMMENTS_FILE);
			if (fs.existsSync(commentsPath)) {
				parseNodeComments(
					JSON.parse(fs.readFileSync(commentsPath, "utf8")),
					commentsPath,
				);
			}

			const relatedPath = path.join(nodeDir, SPEC_RELATED_FILE);
			if (fs.existsSync(relatedPath)) {
				parseRelatedFile(
					JSON.parse(fs.readFileSync(relatedPath, "utf8")),
					relatedPath,
				);
			} else if (
				doc.node.specLevel === "domain" ||
				doc.node.specLevel === "area" ||
				doc.node.specLevel === "feature"
			) {
				issues.push({
					code: "missing-related",
					severity: "warning",
					path: relatedPath,
					message: `Missing ${SPEC_RELATED_FILE}`,
				});
			}

			if (!manifest.nodeTypes[doc.node.specLevel]) {
				issues.push({
					code: "unregistered-node-type",
					severity: "error",
					path: markdownPath,
					message: `Node type ${doc.node.specLevel} is not registered in spec.json`,
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
		const doc = parseNodeDocument({
			nodeDir: nodesBySlug.get(slug)!.dir,
			workspaceDir,
			manifest,
		});
		if (doc.node.parentSlug) {
			const parent = nodesBySlug.get(doc.node.parentSlug);
			if (!parent) {
				// The platform-spec root hub can be implicit for tooling that only scaffolds
				// subtrees. Treat it as always present unless explicitly represented as a node.
				if (doc.node.parentSlug === "platform-spec") continue;
				issues.push({
					code: "missing-parent",
					severity: "error",
					path: slug,
					message: `Parent slug ${doc.node.parentSlug} not found`,
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

	// Validate typed architecture graphs (if the workspace registers and/or stores any).
	const knownSpecSlugs = new Set(nodesBySlug.keys());
	const archIssues = validateArchitectureGraphsInWorkspace(
		workspaceDir,
		knownSpecSlugs,
	);
	for (const issue of archIssues) {
		issues.push({
			code: issue.code,
			severity: "error",
			path: issue.path ?? "architecture-graph",
			message: issue.message,
		});
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
	ensureDefaultTemplates(workspaceDir);

	const rootNodeDir = path.join(workspaceDir, manifest.contentRoot);
	if (!fs.existsSync(path.join(rootNodeDir, SPEC_MARKDOWN_FILE))) {
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
