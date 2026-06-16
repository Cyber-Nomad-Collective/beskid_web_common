import fs from "node:fs";
import path from "node:path";
import {
	SPEC_CONTENT_FILE,
	SPEC_MARKDOWN_FILE,
	SPEC_NODE_FILE,
	SPEC_WORKSPACE_MANIFEST,
} from "./constants.js";
import {
	applyGeneratedHubSections,
	ensureHubGenerateMarkers,
	stripHandAuthoredHubLists,
} from "./generate-hub-sections.js";
import { splitMdxFrontmatter } from "./import-legacy-mdx.js";
import {
	collectContentNodeDirs,
	frontmatterFromNode,
	parseNodeDocument,
	readNodeDocumentRaw,
	writeNodeDocument,
} from "./node-document.js";
import { parseNodeMetadata } from "./node/schema.js";
import {
	listHubChildAdrs,
	listHubChildArticles,
} from "./template-resolve.js";
import {
	parseWorkspaceManifest,
	type WorkspaceManifest,
} from "./workspace/schema.js";

export interface MigrateV2Result {
	migrated: number;
	removedNodeJson: number;
	removedContentJson: number;
	errors: string[];
}

function collectLegacyNodeDirs(contentRoot: string): string[] {
	const dirs = new Set<string>(collectContentNodeDirs(contentRoot));
	if (!fs.existsSync(contentRoot)) return [...dirs];

	function walk(dir: string) {
		if (fs.existsSync(path.join(dir, SPEC_NODE_FILE))) {
			dirs.add(dir);
		}
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory() && !entry.name.startsWith(".")) {
				walk(path.join(dir, entry.name));
			}
		}
	}
	walk(contentRoot);
	return [...dirs];
}

export function migrateWorkspaceToV2(workspaceDir: string): MigrateV2Result {
	const manifestPath = path.join(workspaceDir, SPEC_WORKSPACE_MANIFEST);
	const manifest = parseWorkspaceManifest(
		JSON.parse(fs.readFileSync(manifestPath, "utf8")),
		manifestPath,
	);
	const contentRoot = path.join(workspaceDir, manifest.contentRoot);
	const result: MigrateV2Result = {
		migrated: 0,
		removedNodeJson: 0,
		removedContentJson: 0,
		errors: [],
	};

	for (const nodeDir of collectLegacyNodeDirs(contentRoot)) {
		try {
			const nodeJsonPath = path.join(nodeDir, SPEC_NODE_FILE);
			const contentJsonPath = path.join(nodeDir, SPEC_CONTENT_FILE);
			const markdownPath = path.join(nodeDir, SPEC_MARKDOWN_FILE);

			let frontmatter: Record<string, unknown> = {};
			let body = "";

			if (fs.existsSync(markdownPath)) {
				const parsed = splitMdxFrontmatter(readNodeDocumentRaw(nodeDir));
				frontmatter = parsed.frontmatter;
				body = parsed.body;
			}

			if (fs.existsSync(nodeJsonPath)) {
				const node = parseNodeMetadata(
					JSON.parse(fs.readFileSync(nodeJsonPath, "utf8")),
				);
				frontmatter = { ...frontmatterFromNode(node), ...frontmatter };
				if (!body.trim() && node.description) {
					body = node.description;
				}
			}

			if (!Object.keys(frontmatter).length && !body.trim()) {
				result.errors.push(`${nodeDir}: nothing to migrate`);
				continue;
			}

			writeNodeDocument(nodeDir, frontmatter, body);
			result.migrated++;

			if (fs.existsSync(nodeJsonPath)) {
				fs.unlinkSync(nodeJsonPath);
				result.removedNodeJson++;
			}
			if (fs.existsSync(contentJsonPath)) {
				fs.unlinkSync(contentJsonPath);
				result.removedContentJson++;
			}
		} catch (err) {
			result.errors.push(
				`${nodeDir}: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	return result;
}

export interface SyncWorkspaceResult {
	synced: number;
	unchanged: number;
	errors: string[];
}

export function syncWorkspaceGeneratedSections(
	workspaceDir: string,
	manifest?: WorkspaceManifest,
): SyncWorkspaceResult {
	const manifestPath = path.join(workspaceDir, SPEC_WORKSPACE_MANIFEST);
	const resolved =
		manifest ??
		parseWorkspaceManifest(
			JSON.parse(fs.readFileSync(manifestPath, "utf8")),
			manifestPath,
		);
	const contentRoot = path.join(workspaceDir, resolved.contentRoot);
	const result: SyncWorkspaceResult = { synced: 0, unchanged: 0, errors: [] };

	for (const nodeDir of collectContentNodeDirs(contentRoot)) {
		try {
			const doc = parseNodeDocument({
				nodeDir,
				workspaceDir,
				manifest: resolved,
			});
			if (doc.node.specLevel !== "feature") {
				result.unchanged++;
				continue;
			}

			let body = stripHandAuthoredHubLists(doc.body);
			body = ensureHubGenerateMarkers(body);
			const adrs = listHubChildAdrs(nodeDir);
			const articles = listHubChildArticles(nodeDir);
			const nextBody = applyGeneratedHubSections(body, adrs, articles);

			if (nextBody !== doc.body) {
				writeNodeDocument(nodeDir, doc.frontmatter, nextBody);
				result.synced++;
			} else {
				result.unchanged++;
			}
		} catch (err) {
			result.errors.push(
				`${nodeDir}: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	return result;
}

export function deleteLegacyContentJson(workspaceDir: string): number {
	const manifest = parseWorkspaceManifest(
		JSON.parse(
			fs.readFileSync(path.join(workspaceDir, SPEC_WORKSPACE_MANIFEST), "utf8"),
		),
	);
	const contentRoot = path.join(workspaceDir, manifest.contentRoot);
	let removed = 0;
	for (const nodeDir of collectContentNodeDirs(contentRoot)) {
		const contentJsonPath = path.join(nodeDir, SPEC_CONTENT_FILE);
		if (fs.existsSync(contentJsonPath)) {
			fs.unlinkSync(contentJsonPath);
			removed++;
		}
	}
	return removed;
}
