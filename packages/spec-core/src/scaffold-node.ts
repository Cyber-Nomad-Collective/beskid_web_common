import fs from "node:fs";
import path from "node:path";
import {
	SPEC_COMMENTS_FILE,
	SPEC_LAYOUT_FILE,
	SPEC_NODE_FILE,
} from "./constants.js";
import { layoutFileWithGrid, type LayoutFile } from "./grid-layout.js";
import {
	scaffoldMarkdownSections,
	writeNodeMarkdown,
} from "./markdown-content.js";
import { specLevelFromTypeFlag } from "./node-types.js";
import type { NodeMetadata } from "./node/schema.js";
import { nodeDirFromSlug } from "./path-rules.js";
import {
	DEFAULT_WORKSPACE_MANIFEST,
	parseWorkspaceManifest,
	type SpecLevel,
	type WorkspaceManifest,
} from "./workspace/schema.js";
import { getPresetBase } from "@cyber-nomad-collective/trudoc/layout";

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

function inferParentSlug(slug: string): string {
	if (slug === "platform-spec") return "platform-spec";
	const parts = slug.split("/").filter(Boolean);
	if (parts.length <= 1) return "platform-spec";
	return parts.slice(0, -1).join("/");
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

	const slug = normalizeSlug(options.slug);
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
				? inferParentSlug(slug)
				: options.parentSlug,
		status: options.status ?? "draft",
	};

	if (level === "root") {
		node.parentSlug = null;
	} else if (level === "adr") {
		node.adrId = slug.split("/").pop()!.toUpperCase();
		node.adrStatus = "proposed";
		node.adrDate = new Date().toISOString().slice(0, 10);
	}

	const nodeDir = path.join(
		options.workspaceDir,
		nodeDirFromSlug(manifest.contentRoot, slug),
	);
	fs.mkdirSync(nodeDir, { recursive: true });

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
		path.join(nodeDir, SPEC_NODE_FILE),
		`${JSON.stringify(node, null, 2)}\n`,
	);
	writeNodeMarkdown(
		nodeDir,
		scaffoldMarkdownSections(registration.contentSections ?? []),
	);
	fs.writeFileSync(
		path.join(nodeDir, SPEC_LAYOUT_FILE),
		`${JSON.stringify(layout, null, 2)}\n`,
	);
	fs.writeFileSync(
		path.join(nodeDir, SPEC_COMMENTS_FILE),
		`${JSON.stringify({ version: 1, comments: [] }, null, 2)}\n`,
	);

	return { nodeDir, node, level };
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
				contentSections: ["overview", "scope"],
			},
			area: {
				label: "Area",
				extendsLayout: "area-default",
				childLevels: ["feature", "area"],
				contentSections: ["overview"],
			},
			feature: {
				label: "Feature",
				extendsLayout: "feature-hub-default",
				childLevels: ["article", "adr", "feature"],
				contentSections: ["summary"],
			},
			article: {
				label: "Article",
				extendsLayout: "article-default",
				contentSections: ["summary", "details"],
			},
			adr: {
				label: "ADR",
				extendsLayout: "article-default",
				contentSections: ["context", "decision", "consequences"],
				adrRequired: true,
			},
		},
		architectureGraphs: [],
	};
}
