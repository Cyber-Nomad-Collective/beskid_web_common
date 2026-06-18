import fs from "node:fs";
import path from "node:path";
import {
	SPEC_ADR_DIR,
	SPEC_ARTICLES_DIR,
	SPEC_COMMENTS_FILE,
	SPEC_LAYOUT_FILE,
	SPEC_MARKDOWN_FILE,
	SPEC_RELATED_FILE,
} from "./constants.js";
import { layoutFileWithGrid, type LayoutFile } from "./grid-layout.js";
import { isHubLevel } from "./node-path.js";
import { specLevelFromTypeFlag } from "./node-types.js";
import type { NodeMetadata } from "./node/schema.js";
import {
	frontmatterFromNode,
	parseNodeDocument,
	writeNodeDocument,
} from "./node-document.js";
import { nodeDirFromSlug, nodeRelForLevel } from "./path-rules.js";
import { emptyRelatedFile } from "./related/schema.js";
import {
	DEFAULT_WORKSPACE_MANIFEST,
	parseWorkspaceManifest,
	type SpecLevel,
	type WorkspaceManifest,
} from "./workspace/schema.js";
import { getPresetBase } from "./layout/presets.js";
import {
	DEFAULT_ADR_TEMPLATE,
	DEFAULT_ARTICLE_TEMPLATE,
	DEFAULT_DOMAIN_TEMPLATE,
	DEFAULT_AREA_TEMPLATE,
	DEFAULT_FEATURE_TEMPLATE,
	readLevelTemplate,
} from "./template-resolve.js";
import { splitMdxFrontmatter } from "./import-legacy-mdx.js";

export interface CreateNodeOptions {
	workspaceDir: string;
	typeFlag: string;
	slug: string;
	title?: string;
	parentSlug?: string | null;
	status?: string;
	manifest?: WorkspaceManifest;
}

export interface CreateNodeResult {
	nodeDir: string;
	node: NodeMetadata;
	level: SpecLevel;
}

function normalizeSlug(slug: string): string {
	const trimmed = slug.replace(/^\/+|\/+$/g, "");
	if (trimmed === "platform-spec") return "platform-spec";
	return trimmed.startsWith("platform-spec/")
		? trimmed
		: `platform-spec/${trimmed}`;
}

function canonicalSlug(slug: string, level: SpecLevel): string {
	const normalized = normalizeSlug(slug);
	if (level === "article" || level === "adr") {
		const rel = nodeRelForLevel(normalized, level);
		return rel ? `platform-spec/${rel}` : normalized;
	}
	return normalized;
}

function inferParentSlug(slug: string, level: SpecLevel): string {
	if (slug === "platform-spec") return "platform-spec";
	if (level === "article") {
		const rel = slug.replace(/^platform-spec\/?/, "");
		const articlesIdx = rel.indexOf("/articles/");
		if (articlesIdx !== -1) {
			const hub = rel.slice(0, articlesIdx);
			return hub ? `platform-spec/${hub}` : "platform-spec";
		}
	}
	if (level === "adr") {
		const rel = slug.replace(/^platform-spec\/?/, "");
		const adrIdx = rel.indexOf("/adr/");
		if (adrIdx !== -1) {
			const hub = rel.slice(0, adrIdx);
			return hub ? `platform-spec/${hub}` : "platform-spec";
		}
	}
	const parts = slug.split("/").filter(Boolean);
	if (parts.length <= 1) return "platform-spec";
	return parts.slice(0, -1).join("/");
}

function scaffoldBodyFromTemplate(input: {
	workspaceDir: string;
	contentRoot: string;
	nodeRel: string;
	level: SpecLevel;
	title: string;
}): { frontmatter: Record<string, unknown>; body: string } {
	const template = readLevelTemplate({
		workspaceDir: input.workspaceDir,
		contentRoot: input.contentRoot,
		nodeRel: input.nodeRel,
		level: input.level,
	});

	const raw =
		template ??
		(input.level === "domain" || input.level === "root"
			? DEFAULT_DOMAIN_TEMPLATE
			: input.level === "area"
				? DEFAULT_AREA_TEMPLATE
				: input.level === "feature"
					? DEFAULT_FEATURE_TEMPLATE
					: input.level === "adr"
						? DEFAULT_ADR_TEMPLATE
						: input.level === "article"
							? DEFAULT_ARTICLE_TEMPLATE
							: DEFAULT_FEATURE_TEMPLATE);
	const { frontmatter, body } = splitMdxFrontmatter(raw);
	return {
		frontmatter: {
			...frontmatter,
			title: input.title,
			specLevel: input.level === "root" ? "domain" : input.level,
		},
		body,
	};
}

export function createSpecNode(options: CreateNodeOptions): CreateNodeResult {
	const manifest =
		options.manifest ??
		parseWorkspaceManifest(
			JSON.parse(
				fs.readFileSync(
					path.join(options.workspaceDir, "spec.json"),
					"utf8",
				),
			),
		);

	const level = specLevelFromTypeFlag(options.typeFlag);
	if (!level) {
		throw new Error(
			`Unknown node type "${options.typeFlag}". Use Domain, Area, Feature, Article, or ADR.`,
		);
	}

	const registration = manifest.nodeTypes[level];
	if (!registration) {
		throw new Error(`Node type ${level} is not registered in spec.json`);
	}

	const slug = canonicalSlug(options.slug, level);
	const title =
		options.title ??
		slug
			.split("/")
			.pop()!
			.replace(/-/g, " ")
			.replace(/\b\w/g, (char) => char.toUpperCase());

	const node: NodeMetadata = {
		version: 1,
		specLevel: level,
		slug,
		title,
		parentSlug:
			options.parentSlug === undefined
				? inferParentSlug(slug, level)
				: options.parentSlug,
		status:
			level === "feature" || level === "article" || level === "adr"
				? options.status ?? "Proposed"
				: undefined,
	};

	if (level === "root") {
		node.parentSlug = null;
	} else if (level === "adr") {
		node.adrId = slug.split("/").pop()!.toUpperCase();
		node.adrStatus = "Proposed";
		node.adrDate = new Date().toISOString().slice(0, 10);
	}

	const nodeDir = path.join(
		options.workspaceDir,
		nodeDirFromSlug(manifest.contentRoot, slug, level),
	);
	fs.mkdirSync(nodeDir, { recursive: true });

	if (isHubLevel(level)) {
		fs.mkdirSync(path.join(nodeDir, SPEC_ARTICLES_DIR), { recursive: true });
		fs.mkdirSync(path.join(nodeDir, SPEC_ADR_DIR), { recursive: true });
	}

	const nodeRel = slug.replace(/^platform-spec\/?/, "");
	const scaffold = scaffoldBodyFromTemplate({
		workspaceDir: options.workspaceDir,
		contentRoot: manifest.contentRoot,
		nodeRel,
		level,
		title,
	});
	const frontmatter = {
		...frontmatterFromNode(node),
		...scaffold.frontmatter,
		title,
	};
	writeNodeDocument(nodeDir, frontmatter, scaffold.body);

	const preset = getPresetBase(registration.extendsLayout);
	const layout: LayoutFile = layoutFileWithGrid({
		...preset,
		version: 1,
		level:
			level === "root"
				? "root"
				: level === "adr"
					? "article"
					: level,
		pathPrefix: node.slug.replace(/\/index$/, ""),
	} as LayoutFile);

	fs.writeFileSync(
		path.join(nodeDir, SPEC_LAYOUT_FILE),
		`${JSON.stringify(layout, null, 2)}\n`,
	);
	fs.writeFileSync(
		path.join(nodeDir, SPEC_COMMENTS_FILE),
		`${JSON.stringify({ version: 1, comments: [] }, null, 2)}\n`,
	);
	fs.writeFileSync(
		path.join(nodeDir, SPEC_RELATED_FILE),
		`${JSON.stringify(emptyRelatedFile(), null, 2)}\n`,
	);

	return { nodeDir, node, level };
}

export function ensureArchitectureFeature(workspaceDir: string): CreateNodeResult {
	const slug = "platform-spec/community/spec-maintenance/architecture";
	const nodeDir = path.join(
		workspaceDir,
		"platform-spec/community/spec-maintenance/architecture",
	);
	if (fs.existsSync(path.join(nodeDir, SPEC_MARKDOWN_FILE))) {
		return {
			nodeDir,
			node: parseNodeDocument({
				nodeDir,
				workspaceDir,
				manifest: parseWorkspaceManifest(
					JSON.parse(
						fs.readFileSync(path.join(workspaceDir, "spec.json"), "utf8"),
					),
				),
			}).node,
			level: "feature",
		};
	}
	return createSpecNode({
		workspaceDir,
		typeFlag: "Feature",
		slug,
		title: "Architecture",
		parentSlug: "platform-spec/community/spec-maintenance",
		status: "Standard",
	});
}

export function defaultManifestForNormativeRepo(): WorkspaceManifest {
	return {
		...DEFAULT_WORKSPACE_MANIFEST,
		nodeTypes: {
			...DEFAULT_WORKSPACE_MANIFEST.nodeTypes,
			root: {
				label: "Root",
				extendsLayout: "root-default",
				childLevels: ["domain"],
			},
			domain: {
				label: "Domain",
				extendsLayout: "domain-default",
				childLevels: ["area", "domain"],
			},
			area: {
				label: "Area",
				extendsLayout: "area-default",
				childLevels: ["feature", "area"],
			},
			feature: {
				label: "Feature",
				extendsLayout: "feature-hub-default",
				childLevels: ["article", "adr", "feature"],
			},
			article: {
				label: "Article",
				extendsLayout: "article-default",
			},
			adr: {
				label: "ADR",
				extendsLayout: "article-default",
				adrRequired: true,
			},
		},
		architectureGraphs: [],
	};
}
