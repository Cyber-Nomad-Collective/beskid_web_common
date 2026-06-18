import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { LayoutPresetKey } from "./layout/schema.js";
import { getPresetBase } from "./layout/presets.js";
import {
	SPEC_ADR_DIR,
	SPEC_ARTICLES_DIR,
	SPEC_LAYOUT_FILE,
	SPEC_MARKDOWN_FILE,
	SPEC_NODE_FILE,
	SPEC_RELATED_FILE,
} from "./constants.js";
import { type ContentBlock, type NodeContent } from "./content/schema.js";
import { layoutFileWithGrid, type LayoutFile } from "./grid-layout.js";
import { isHubLevel } from "./node-path.js";
import type { NodeMetadata } from "./node/schema.js";
import {
	pathClassFromNodeRel,
	parentSlugFromNodeRel,
} from "./node-path.js";
import {
	pathClassFromRel,
	parentSlugFromPath,
	slugFromSpecRel,
	specLevelFromPathClass,
} from "./path-rules.js";
import {
	emptyRelatedFile,
	relatedTopicsFromFrontmatter,
} from "./related/schema.js";
import type { WorkspaceManifest } from "./workspace/schema.js";
import { writeNodeMarkdown } from "./markdown-content.js";
import { stripMdxPresentationSurface } from "./strip-mdx-surface.js";

const SPEC_SECTION_RE =
	/<SpecSection\s+id=["']([^"']+)["'](?:\s+title=["']([^"']*)["'])?\s*\/?>([\s\S]*?)<\/SpecSection>|<SpecSection\s+id=["']([^"']+)["'](?:\s+title=["']([^"']*)["'])?\s*\/>/gi;

const DOMAIN_TILES_RE =
	/<DomainTiles\s+pathPrefix=["']([^"']+)["'](?:\s+heading=["']([^"']*)["'])?\s*\/?>/gi;

const require = createRequire(import.meta.url);
const { parse: parseYaml } = require("yaml") as typeof import("yaml");

export function splitMdxFrontmatter(raw: string): {
	frontmatter: Record<string, unknown>;
	body: string;
} {
	if (!raw.startsWith("---")) {
		return { frontmatter: {}, body: raw };
	}
	const end = raw.indexOf("\n---", 3);
	if (end === -1) {
		return { frontmatter: {}, body: raw };
	}
	const yaml = raw.slice(3, end).trim();
	let frontmatter: Record<string, unknown> = {};
	try {
		const parsed = parseYaml(yaml) as unknown;
		if (parsed && typeof parsed === "object") {
			frontmatter = parsed as Record<string, unknown>;
		}
	} catch {
		frontmatter = {};
	}
	return { frontmatter, body: raw.slice(end + 4) };
}

function parseSpecSections(body: string): ContentBlock[] {
	const normalizedBody = stripMdxPresentationSurface(body);
	const blocks: ContentBlock[] = [];
	let lastIndex = 0;
	const sectionMatches = [...normalizedBody.matchAll(SPEC_SECTION_RE)];

	for (const match of sectionMatches) {
		const before = normalizedBody.slice(lastIndex, match.index).trim();
		if (before) {
			blocks.push({ type: "markdownProse", bodyMd: before });
		}
		const id = match[1] ?? match[4] ?? "";
		const title = match[2] ?? match[5];
		const inner = stripMdxPresentationSurface(match[3]?.trim() ?? "");
		blocks.push({
			type: "specSection",
			id,
			title: title || undefined,
			bodyMd: inner,
		});
		lastIndex = (match.index ?? 0) + match[0].length;
	}

	const tail = normalizedBody.slice(lastIndex).trim();
	if (tail) {
		for (const tileMatch of body.matchAll(DOMAIN_TILES_RE)) {
			blocks.push({
				type: "domainTiles",
				props: {
					pathPrefix: tileMatch[1] ?? "",
					heading: tileMatch[2] ?? "Explore",
				},
			});
		}
		if (tail) {
			blocks.push({ type: "markdownProse", bodyMd: tail });
		}
	}

	if (blocks.length === 0 && normalizedBody.trim()) {
		blocks.push({ type: "markdownProse", bodyMd: normalizedBody.trim() });
	}

	return blocks;
}

function contentToMarkdown(content: NodeContent): string {
	const markdown = content.blocks
		.map((block) => {
			if (block.type === "markdownProse") return block.bodyMd.trim();
			if (block.type === "specSection") {
				const title = block.title ?? block.id;
				return `## ${title}\n\n${block.bodyMd.trim()}`;
			}
			return "";
		})
		.filter(Boolean)
		.join("\n\n");
	return stripMdxPresentationSurface(markdown);
}

function resolveNodeRel(relFromMdxRoot: string, pathClass: ReturnType<typeof pathClassFromRel>): string {
	const base = relFromMdxRoot.replace(/\/index$/, "");
	const segments = base.split("/").filter(Boolean);
	const specLevel = specLevelFromPathClass(pathClass);

	if (specLevel === "article") {
		if (base.includes("/articles/")) return base;
		// Area-level feature hubs (3 segments) stay as sibling directories, not under articles/.
		if (segments.length <= 3) return base;
		const parts = base.split("/");
		const leaf = parts.pop()!;
		const hub = parts.join("/");
		return hub ? `${hub}/${SPEC_ARTICLES_DIR}/${leaf}` : `${SPEC_ARTICLES_DIR}/${leaf}`;
	}

	if (specLevel === "adr") {
		if (base.includes(`/${SPEC_ADR_DIR}/`)) return base;
		const parts = base.split("/");
		const leaf = parts.pop()!;
		const hub = parts.join("/");
		return hub ? `${hub}/${SPEC_ADR_DIR}/${leaf}` : `${SPEC_ADR_DIR}/${leaf}`;
	}

	return base;
}

function canonicalSlugFromRel(nodeRel: string, pathClass: ReturnType<typeof pathClassFromRel>): string {
	const pathClassForNode = pathClassFromNodeRel(nodeRel);
	const parentSlug = parentSlugFromNodeRel(nodeRel, pathClassForNode);
	const specLevel = specLevelFromPathClass(pathClass);
	const leaf = nodeRel.split("/").pop() ?? nodeRel;
	if (specLevel === "article" || specLevel === "adr") {
		return parentSlug ? `${parentSlug}/${specLevel === "article" ? SPEC_ARTICLES_DIR : SPEC_ADR_DIR}/${leaf}` : `platform-spec/${nodeRel}`;
	}
	return slugFromSpecRel(nodeRel);
}

function frontmatterToNodeWithRelated(
	frontmatter: Record<string, unknown>,
	slug: string,
	pathClass: ReturnType<typeof pathClassFromRel>,
): { node: NodeMetadata; relatedTopics?: unknown[] } {
	const owner = frontmatter.owner as
		| { name?: string; email?: string }
		| undefined;
	const submitter = frontmatter.submitter as
		| { name?: string; email?: string }
		| undefined;
	const specLevel = specLevelFromPathClass(pathClass);
	const relatedTopics = Array.isArray(frontmatter.relatedTopics)
		? (frontmatter.relatedTopics as unknown[])
		: undefined;

	const node: NodeMetadata = {
		version: 1,
		specLevel,
		slug,
		title: String(frontmatter.title ?? slug.split("/").pop() ?? slug),
		description: frontmatter.description
			? String(frontmatter.description)
			: undefined,
		parentSlug: parentSlugFromPath(slug, pathClass),
		status: frontmatter.status ? String(frontmatter.status) : undefined,
		owner,
		submitter,
		adrId: frontmatter.adrId ? String(frontmatter.adrId) : undefined,
		adrStatus: frontmatter.adrStatus
			? String(frontmatter.adrStatus)
			: undefined,
		adrDate: frontmatter.adrDate ? String(frontmatter.adrDate) : undefined,
		lastReviewed: frontmatter.lastReviewed
			? String(frontmatter.lastReviewed)
			: undefined,
	};

	return { node, relatedTopics };
}

function frontmatterToNode(
	frontmatter: Record<string, unknown>,
	slug: string,
	pathClass: ReturnType<typeof pathClassFromRel>,
): NodeMetadata {
	return frontmatterToNodeWithRelated(frontmatter, slug, pathClass).node;
}

function inferLayoutFromMdx(
	pathClass: ReturnType<typeof pathClassFromRel>,
	slug: string,
	body: string,
	existingLayoutPath: string | null,
): LayoutFile {
	if (existingLayoutPath && fs.existsSync(existingLayoutPath)) {
		try {
			const raw = JSON.parse(fs.readFileSync(existingLayoutPath, "utf8")) as Record<
				string,
				unknown
			>;
			if (raw.extends === "feature-default") {
				raw.extends = "feature-hub-default";
			}
			return layoutFileWithGrid(raw as LayoutFile);
		} catch {
			// Fall through to inferred layout when legacy layout.json is invalid.
		}
	}

	const presetKey: LayoutPresetKey =
		pathClass === "domain-root"
			? "root-default"
			: pathClass === "domain"
				? "domain-default"
				: pathClass === "area"
					? "area-default"
					: pathClass === "feature"
						? "feature-hub-default"
						: "article-default";

	const base = getPresetBase(presetKey);
	const pathPrefix = slug.replace(/\/index$/, "");
	const layout: LayoutFile = {
		...base,
		version: 1,
		level:
			pathClass === "domain-root"
				? "root"
				: pathClass === "domain"
					? "domain"
					: pathClass === "area"
						? "area"
						: pathClass === "feature"
							? "feature"
							: "article",
		pathPrefix,
		widgets: [],
	} as LayoutFile;

	if (
		pathClass === "domain" ||
		pathClass === "area" ||
		pathClass === "feature" ||
		pathClass === "domain-root"
	) {
		layout.widgets = [
			{
				type: "domainTiles",
				props: { pathPrefix, heading: "Explore" },
			},
		];
	}

	if (body.includes("<DomainTiles")) {
		for (const match of body.matchAll(DOMAIN_TILES_RE)) {
			layout.widgets = [
				{
					type: "domainTiles",
					props: {
						pathPrefix: match[1] ?? pathPrefix,
						heading: match[2] ?? "Explore",
					},
				},
			];
		}
	}

	return layoutFileWithGrid(layout);
}

export interface ImportLegacyMdxOptions {
	mdxRoot: string;
	outputRoot: string;
	manifest: WorkspaceManifest;
}

export interface ImportLegacyMdxResult {
	imported: number;
	skipped: number;
	errors: string[];
}

function collectMdxFiles(dir: string): string[] {
	const out: string[] = [];
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...collectMdxFiles(full));
		} else if (/\.(mdx?|MDX?)$/.test(entry.name)) {
			out.push(full);
		}
	}
	return out;
}

export function importLegacyMdxTree(
	options: ImportLegacyMdxOptions,
): ImportLegacyMdxResult {
	const { mdxRoot, outputRoot, manifest } = options;
	const contentRoot = path.join(outputRoot, manifest.contentRoot);
	const result: ImportLegacyMdxResult = { imported: 0, skipped: 0, errors: [] };

	fs.mkdirSync(contentRoot, { recursive: true });

	const files = collectMdxFiles(mdxRoot);
	for (const file of files) {
		try {
			const relFromMdxRoot = path
				.relative(mdxRoot, file)
				.split(path.sep)
				.join("/")
				.replace(/\.(md|mdx)$/i, "")
				.replace(/\/index$/, "");

			const pathClass = pathClassFromRel(relFromMdxRoot);
			if (pathClass === "legacy-or-bridge" || pathClass === "component") {
				result.skipped++;
				continue;
			}

			const slug = slugFromSpecRel(relFromMdxRoot);
			const nodeRel = resolveNodeRel(relFromMdxRoot, pathClass);
			const nodePathClass = pathClassFromNodeRel(nodeRel);
			const canonicalSlug = slugFromSpecRel(nodeRel);
			const nodeDir = path.join(contentRoot, nodeRel);

			const raw = fs.readFileSync(file, "utf8");
			const { frontmatter, body } = splitMdxFrontmatter(raw);
			const { node, relatedTopics } = frontmatterToNodeWithRelated(
				frontmatter,
				canonicalSlug,
				nodePathClass === "legacy-or-bridge" ? pathClass : nodePathClass,
			);
			node.slug = canonicalSlug;
			node.parentSlug = parentSlugFromNodeRel(nodeRel, nodePathClass);
			const content: NodeContent = {
				version: 1,
				blocks: parseSpecSections(body),
			};

			const layoutPath = path.join(path.dirname(file), "layout.json");
			const layout = inferLayoutFromMdx(
				pathClass,
				canonicalSlug,
				body,
				layoutPath,
			);

			fs.mkdirSync(nodeDir, { recursive: true });
			if (isHubLevel(node.specLevel)) {
				fs.mkdirSync(path.join(nodeDir, SPEC_ARTICLES_DIR), { recursive: true });
				fs.mkdirSync(path.join(nodeDir, SPEC_ADR_DIR), { recursive: true });
			}
			fs.writeFileSync(
				path.join(nodeDir, SPEC_NODE_FILE),
				`${JSON.stringify(node, null, 2)}\n`,
			);
			writeNodeMarkdown(nodeDir, contentToMarkdown(content));
			fs.writeFileSync(
				path.join(nodeDir, SPEC_LAYOUT_FILE),
				`${JSON.stringify(layout, null, 2)}\n`,
			);
			const relatedTopicsParsed = relatedTopicsFromFrontmatter(relatedTopics);
			fs.writeFileSync(
				path.join(nodeDir, SPEC_RELATED_FILE),
				`${JSON.stringify({ version: 1, topics: relatedTopicsParsed }, null, 2)}\n`,
			);
			result.imported++;
		} catch (err) {
			result.errors.push(
				`${file}: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	return result;
}

export function importSingleMdxFile(
	mdxPath: string,
	nodeDir: string,
): { node: NodeMetadata; content: NodeContent; layout: LayoutFile } {
	const rel = path.basename(mdxPath).replace(/\.(md|mdx)$/i, "");
	const raw = fs.readFileSync(mdxPath, "utf8");
	const { frontmatter, body } = splitMdxFrontmatter(raw);
	const slug = slugFromSpecRel(rel);
	const pathClass = pathClassFromRel(rel);
	const node = frontmatterToNode(frontmatter, slug, pathClass);
	const content: NodeContent = {
		version: 1,
		blocks: parseSpecSections(body),
	};
	const layoutPath = path.join(path.dirname(mdxPath), "layout.json");
	const layout = inferLayoutFromMdx(pathClass, slug, body, layoutPath);

	fs.mkdirSync(nodeDir, { recursive: true });
	fs.writeFileSync(
		path.join(nodeDir, SPEC_NODE_FILE),
		`${JSON.stringify(node, null, 2)}\n`,
	);
	fs.writeFileSync(
		path.join(nodeDir, SPEC_LAYOUT_FILE),
		`${JSON.stringify(layout, null, 2)}\n`,
	);

	return { node, content, layout };
}
