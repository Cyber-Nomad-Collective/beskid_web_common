import fs from "node:fs";
import path from "node:path";
import {
	SPEC_ADR_DIR,
	SPEC_ARTICLES_DIR,
	SPEC_MARKDOWN_FILE,
	SPEC_TEMPLATES_DIR,
} from "./constants.js";
import type { SpecLevel } from "./workspace/schema.js";
import { splitMdxFrontmatter } from "./import-legacy-mdx.js";
import type { HubChildAdr, HubChildArticle } from "./generate-hub-sections.js";

export const DOMAIN_TEMPLATE_FILE = "DOMAIN_TEMPLATE.md";
export const AREA_TEMPLATE_FILE = "AREA_TEMPLATE.md";
export const FEATURE_TEMPLATE_FILE = "FEATURE_TEMPLATE.md";

const TEMPLATE_BY_LEVEL: Partial<Record<SpecLevel, string>> = {
	root: DOMAIN_TEMPLATE_FILE,
	domain: DOMAIN_TEMPLATE_FILE,
	area: AREA_TEMPLATE_FILE,
	feature: FEATURE_TEMPLATE_FILE,
};

export function templateFileForLevel(level: SpecLevel): string | null {
	return TEMPLATE_BY_LEVEL[level] ?? null;
}

function hubAncestors(nodeRel: string): string[] {
	const segments = nodeRel.split("/").filter(Boolean);
	const out: string[] = [];
	for (let i = segments.length; i > 0; i -= 1) {
		out.push(segments.slice(0, i).join("/"));
	}
	return out;
}

export function resolveLevelTemplatePath(input: {
	workspaceDir: string;
	contentRoot: string;
	nodeRel: string;
	level: SpecLevel;
}): string | null {
	const fileName = templateFileForLevel(input.level);
	if (!fileName) return null;

	for (const ancestor of hubAncestors(input.nodeRel)) {
		const local = path.join(
			input.workspaceDir,
			input.contentRoot,
			ancestor,
			fileName,
		);
		if (fs.existsSync(local)) return local;
	}

	const global = path.join(
		input.workspaceDir,
		SPEC_TEMPLATES_DIR,
		fileName,
	);
	if (fs.existsSync(global)) return global;
	return null;
}

export function readLevelTemplate(input: {
	workspaceDir: string;
	contentRoot: string;
	nodeRel: string;
	level: SpecLevel;
}): string | null {
	const templatePath = resolveLevelTemplatePath(input);
	if (!templatePath) return null;
	return fs.readFileSync(templatePath, "utf8");
}

export function listHubChildAdrs(hubDir: string): HubChildAdr[] {
	const adrRoot = path.join(hubDir, SPEC_ADR_DIR);
	if (!fs.existsSync(adrRoot)) return [];
	const out: HubChildAdr[] = [];
	for (const entry of fs.readdirSync(adrRoot, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const contentPath = path.join(adrRoot, entry.name, SPEC_MARKDOWN_FILE);
		if (!fs.existsSync(contentPath)) continue;
		const raw = fs.readFileSync(contentPath, "utf8");
		const { frontmatter } = splitMdxFrontmatter(raw);
		out.push({
			dirName: entry.name,
			adrId: String(frontmatter.adrId ?? entry.name),
			adrStatus: String(frontmatter.adrStatus ?? "Proposed"),
			title: String(frontmatter.title ?? entry.name),
		});
	}
	return out.sort((a, b) => a.dirName.localeCompare(b.dirName));
}

export function listHubChildArticles(hubDir: string): HubChildArticle[] {
	const articlesRoot = path.join(hubDir, SPEC_ARTICLES_DIR);
	if (!fs.existsSync(articlesRoot)) return [];
	const out: HubChildArticle[] = [];
	for (const entry of fs.readdirSync(articlesRoot, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const contentPath = path.join(articlesRoot, entry.name, SPEC_MARKDOWN_FILE);
		if (!fs.existsSync(contentPath)) continue;
		const raw = fs.readFileSync(contentPath, "utf8");
		const { frontmatter } = splitMdxFrontmatter(raw);
		out.push({
			dirName: entry.name,
			title: String(frontmatter.title ?? entry.name),
		});
	}
	return out.sort((a, b) => a.dirName.localeCompare(b.dirName));
}

export const DEFAULT_DOMAIN_TEMPLATE = `---
specLevel: domain
title: Domain title
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
---

## Overview
This domain defines the scope and boundaries for related areas and features.

## Scope
This domain scope explains what is included (and what is intentionally out of scope).
`;

export const DEFAULT_AREA_TEMPLATE = `---
specLevel: area
title: Area title
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
---

## Overview
This area groups a cohesive set of features with a shared responsibility boundary.
`;

export const DEFAULT_FEATURE_TEMPLATE = `---
specLevel: feature
title: Feature title
status: Proposed
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
---

## Summary
This feature hub defines canonical behavior that downstream articles and ADRs must follow.

## Implementation anchors
When behavior changes, update the listed anchors first so the rest of the hub can remain stable.

## Decisions
The decision summary below is generated from the hub's \`adr/\` directory.
<!-- spec:generate:adr-index -->
<!-- /spec:generate:adr-index -->

## Articles
The article reading order below is generated from the hub's \`articles/\` directory.
<!-- spec:generate:article-index -->
<!-- /spec:generate:article-index -->
`;

export const DEFAULT_ADR_TEMPLATE = `---
specLevel: adr
status: Proposed
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
---

## Context
Release arguments require traceable proof layers and constraints.

## Decision
Use this ADR to make one normative decision explicit and reviewable.

## Consequences
Conformance evidence can be verified against stable identifiers.
`;

export const DEFAULT_ARTICLE_TEMPLATE = `---
specLevel: article
title: Article title
status: Proposed
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
---

## Summary
This article explains how the feature hub contract is applied in practice.

## Details
Include concrete behavior, procedures, and verification notes here.
`;

export function ensureDefaultTemplates(workspaceDir: string): void {
	const dir = path.join(workspaceDir, SPEC_TEMPLATES_DIR);
	fs.mkdirSync(dir, { recursive: true });
	const files: Array<[string, string]> = [
		[DOMAIN_TEMPLATE_FILE, DEFAULT_DOMAIN_TEMPLATE],
		[AREA_TEMPLATE_FILE, DEFAULT_AREA_TEMPLATE],
		[FEATURE_TEMPLATE_FILE, DEFAULT_FEATURE_TEMPLATE],
	];
	for (const [name, content] of files) {
		const file = path.join(dir, name);
		if (!fs.existsSync(file)) {
			fs.writeFileSync(file, content);
		}
	}
}
