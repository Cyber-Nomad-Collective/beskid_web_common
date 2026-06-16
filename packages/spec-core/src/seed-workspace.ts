import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { SPEC_NODE_FILE, SPEC_SEED_CHECKSUM_FILE, SPEC_WORKSPACE_MANIFEST } from "./constants.js";
import { importLegacyMdxTree } from "./import-legacy-mdx.js";
import { scrubWorkspacePresentation } from "./scrub-workspace-presentation.js";
import { parseNodeMetadata } from "./node/schema.js";
import {
	createSpecNode,
	ensureArchitectureFeature,
} from "./scaffold-node.js";
import {
	DEFAULT_WORKSPACE_MANIFEST,
	parseWorkspaceManifest,
	type WorkspaceManifest,
} from "./workspace/schema.js";
import { initWorkspace, validateWorkspace } from "./validate-workspace.js";

export interface SeedWorkspaceOptions {
	workspaceDir: string;
	mdxRoot: string;
	manifest?: WorkspaceManifest;
	force?: boolean;
}

export interface SeedWorkspaceResult {
	checksum: string;
	seeded: boolean;
	imported: number;
	skipped: number;
	errors: string[];
	validationOk: boolean;
}

function collectSourceFiles(root: string): string[] {
	const out: string[] = [];
	if (!fs.existsSync(root)) return out;
	for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
		const full = path.join(root, entry.name);
		if (entry.isDirectory()) {
			out.push(...collectSourceFiles(full));
		} else if (/\.(mdx?|json)$/i.test(entry.name)) {
			out.push(full);
		}
	}
	return out.sort();
}

export function computeSourceChecksum(mdxRoot: string): string {
	const hash = createHash("sha256");
	for (const file of collectSourceFiles(mdxRoot)) {
		const rel = path.relative(mdxRoot, file).replace(/\\/g, "/");
		hash.update(rel);
		hash.update(fs.readFileSync(file));
	}
	return hash.digest("hex");
}

function readStoredChecksum(workspaceDir: string): string | null {
	const file = path.join(workspaceDir, SPEC_SEED_CHECKSUM_FILE);
	if (!fs.existsSync(file)) return null;
	return fs.readFileSync(file, "utf8").trim() || null;
}

function writeStoredChecksum(workspaceDir: string, checksum: string): void {
	const file = path.join(workspaceDir, SPEC_SEED_CHECKSUM_FILE);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, `${checksum}\n`);
}

function ensureParentChain(
	workspaceDir: string,
	manifest: WorkspaceManifest,
): void {
	const contentRoot = path.join(workspaceDir, manifest.contentRoot);
	const nodeDirs = collectNodeDirs(contentRoot);
	const slugs = new Set<string>();

	for (const nodeDir of nodeDirs) {
		const node = parseNodeMetadata(
			JSON.parse(fs.readFileSync(path.join(nodeDir, SPEC_NODE_FILE), "utf8")),
		);
		slugs.add(node.slug);
	}

	for (const slug of slugs) {
		ensureParentNodes(workspaceDir, manifest, slug);
	}
}

function collectNodeDirs(contentRoot: string): string[] {
	const dirs: string[] = [];
	if (!fs.existsSync(contentRoot)) return dirs;
	function walk(dir: string) {
		if (fs.existsSync(path.join(dir, SPEC_NODE_FILE))) dirs.push(dir);
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory() && !entry.name.startsWith(".")) {
				walk(path.join(dir, entry.name));
			}
		}
	}
	walk(contentRoot);
	return dirs;
}

function ensureParentNodes(
	workspaceDir: string,
	manifest: WorkspaceManifest,
	slug: string,
): void {
	const parts = slug.replace(/^platform-spec\/?/, "").split("/").filter(Boolean);
	if (parts.length === 0) return;

	const levels: Array<{ level: "domain" | "area" | "feature"; depth: number }> =
		[
			{ level: "domain", depth: 1 },
			{ level: "area", depth: 2 },
			{ level: "feature", depth: 3 },
		];

	for (const { level, depth } of levels) {
		if (parts.length < depth) break;
		const partial = `platform-spec/${parts.slice(0, depth).join("/")}`;
		const nodeDir = path.join(
			workspaceDir,
			manifest.contentRoot,
			parts.slice(0, depth).join("/"),
		);
		if (!fs.existsSync(path.join(nodeDir, "node.json"))) {
			createSpecNode({
				workspaceDir,
				typeFlag: level.charAt(0).toUpperCase() + level.slice(1),
				slug: partial,
				manifest,
				status: "published",
			});
		}
	}
}

export function seedWorkspace(options: SeedWorkspaceOptions): SeedWorkspaceResult {
	const workspaceDir = path.resolve(options.workspaceDir);
	const mdxRoot = path.resolve(options.mdxRoot);
	const checksum = computeSourceChecksum(mdxRoot);
	const stored = readStoredChecksum(workspaceDir);

	if (!options.force && stored === checksum) {
		const report = validateWorkspace(workspaceDir);
		return {
			checksum,
			seeded: false,
			imported: 0,
			skipped: 0,
			errors: [],
			validationOk: report.ok,
		};
	}

	const manifestPath = path.join(workspaceDir, SPEC_WORKSPACE_MANIFEST);
	if (!fs.existsSync(manifestPath)) {
		initWorkspace(workspaceDir, options.manifest);
	}

	const manifest = options.manifest ??
		parseWorkspaceManifest(
			JSON.parse(fs.readFileSync(manifestPath, "utf8")),
			manifestPath,
		);
	ensureArchitectureFeature(workspaceDir);
	ensureParentNodes(
		workspaceDir,
		manifest,
		"platform-spec/community/spec-maintenance/architecture",
	);

	const importResult = importLegacyMdxTree({
		mdxRoot,
		outputRoot: workspaceDir,
		manifest,
	});

	scrubWorkspacePresentation(workspaceDir, manifest);

	ensureParentChain(workspaceDir, manifest);
	ensureArchitectureFeature(workspaceDir);
	writeStoredChecksum(workspaceDir, checksum);
	const report = validateWorkspace(workspaceDir);

	return {
		checksum,
		seeded: true,
		imported: importResult.imported,
		skipped: importResult.skipped,
		errors: importResult.errors,
		validationOk: report.ok,
	};
}
