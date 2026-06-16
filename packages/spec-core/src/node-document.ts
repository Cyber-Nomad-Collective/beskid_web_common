import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { SPEC_MARKDOWN_FILE } from "./constants.js";
import type { NodeMetadata } from "./node/schema.js";
import { nodeMetadataToFrontmatter } from "./node/schema.js";
import { pathClassFromNodeRel } from "./node-path.js";
import {
	slugFromNodeDir,
	specLevelFromPathClass,
	parentSlugFromNodeRel,
} from "./path-rules.js";
import type { SpecLevel, WorkspaceManifest } from "./workspace/schema.js";
import { splitMdxFrontmatter } from "./import-legacy-mdx.js";

const require = createRequire(import.meta.url);
const { stringify: stringifyYaml } = require("yaml") as typeof import("yaml");

export interface NodeDocument {
	node: NodeMetadata;
	frontmatter: Record<string, unknown>;
	body: string;
	raw: string;
}

export function readNodeDocumentRaw(nodeDir: string): string {
	const file = path.join(nodeDir, SPEC_MARKDOWN_FILE);
	if (!fs.existsSync(file)) return "";
	return fs.readFileSync(file, "utf8");
}

export function writeNodeDocument(
	nodeDir: string,
	frontmatter: Record<string, unknown>,
	body: string,
): void {
	fs.mkdirSync(nodeDir, { recursive: true });
	const yaml = stringifyYaml(frontmatter).trimEnd();
	const normalizedBody = body.trim();
	const content = normalizedBody
		? `---\n${yaml}\n---\n\n${normalizedBody}\n`
		: `---\n${yaml}\n---\n`;
	fs.writeFileSync(path.join(nodeDir, SPEC_MARKDOWN_FILE), content);
}

export function frontmatterFromNode(node: NodeMetadata): Record<string, unknown> {
	return {
		...nodeMetadataToFrontmatter(node),
		specLevel: node.specLevel === "root" ? "domain" : node.specLevel,
	};
}

function titleFromFrontmatterOrPath(
	frontmatter: Record<string, unknown>,
	nodeDir: string,
): string {
	if (typeof frontmatter.title === "string" && frontmatter.title.trim()) {
		return frontmatter.title.trim();
	}
	const leaf = path.basename(nodeDir);
	return leaf
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function parseNodeDocument(input: {
	nodeDir: string;
	workspaceDir: string;
	manifest: WorkspaceManifest;
}): NodeDocument {
	const raw = readNodeDocumentRaw(input.nodeDir);
	if (!raw.trim()) {
		throw new Error(`Missing or empty ${SPEC_MARKDOWN_FILE}`);
	}

	const { frontmatter, body } = splitMdxFrontmatter(raw);
	const rel = path
		.relative(
			path.join(input.workspaceDir, input.manifest.contentRoot),
			input.nodeDir,
		)
		.split(path.sep)
		.join("/");
	const pathClass = pathClassFromNodeRel(rel || "");
	const slug = slugFromNodeDir(
		input.manifest.contentRoot,
		input.nodeDir,
		input.workspaceDir,
	);
	const specLevel = specLevelFromPathClass(pathClass);
	const parentSlug = parentSlugFromNodeRel(rel || "", pathClass);

	const node: NodeMetadata = {
		version: 1,
		specLevel,
		slug,
		title: titleFromFrontmatterOrPath(frontmatter, input.nodeDir),
		description:
			typeof frontmatter.description === "string"
				? frontmatter.description
				: undefined,
		parentSlug,
		status:
			typeof frontmatter.status === "string" ? frontmatter.status : undefined,
		owner: frontmatter.owner as NodeMetadata["owner"],
		submitter: frontmatter.submitter as NodeMetadata["submitter"],
		adrId:
			typeof frontmatter.adrId === "string" ? frontmatter.adrId : undefined,
		adrStatus:
			typeof frontmatter.adrStatus === "string"
				? frontmatter.adrStatus
				: undefined,
		adrDate:
			typeof frontmatter.adrDate === "string"
				? frontmatter.adrDate
				: undefined,
		lastReviewed:
			typeof frontmatter.lastReviewed === "string"
				? frontmatter.lastReviewed
				: undefined,
	};

	return { node, frontmatter, body, raw };
}

export function collectContentNodeDirs(contentRoot: string): string[] {
	const dirs: string[] = [];
	if (!fs.existsSync(contentRoot)) return dirs;

	function walk(dir: string) {
		const markdownPath = path.join(dir, SPEC_MARKDOWN_FILE);
		if (fs.existsSync(markdownPath)) {
			dirs.push(dir);
		}
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (
				entry.isDirectory() &&
				!entry.name.startsWith(".") &&
				entry.name !== "articles" &&
				entry.name !== "adr"
			) {
				walk(path.join(dir, entry.name));
			}
		}
		// Hub child containers: scan article/adr leaf dirs
		for (const childDir of ["articles", "adr"] as const) {
			const container = path.join(dir, childDir);
			if (!fs.existsSync(container)) continue;
			for (const entry of fs.readdirSync(container, { withFileTypes: true })) {
				if (entry.isDirectory()) {
					const leaf = path.join(container, entry.name);
					if (fs.existsSync(path.join(leaf, SPEC_MARKDOWN_FILE))) {
						dirs.push(leaf);
					}
				}
			}
		}
	}

	walk(contentRoot);
	return dirs;
}
