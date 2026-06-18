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
export const ARTICLE_TEMPLATE_FILE = "ARTICLE_TEMPLATE.md";
export const ADR_TEMPLATE_FILE = "ADR_TEMPLATE.md";

const TEMPLATE_BY_LEVEL: Partial<Record<SpecLevel, string>> = {
	root: DOMAIN_TEMPLATE_FILE,
	domain: DOMAIN_TEMPLATE_FILE,
	area: AREA_TEMPLATE_FILE,
	feature: FEATURE_TEMPLATE_FILE,
	article: ARTICLE_TEMPLATE_FILE,
	adr: ADR_TEMPLATE_FILE,
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

/**
 * Uniform template spines — materialize the meta-spec section contracts mandated
 * by platform-spec/community/spec-maintenance/feature-hub-article-bundle-template
 * and ADR D-COMM-HUB-0002. Per-domain templates layer domain-specific subsections
 * on top of these spines; they must not replace the spine.
 *
 * Domain = 8 sections, Area = 8, Feature = 11, Article = 5, ADR = 3.
 */
export const DEFAULT_DOMAIN_TEMPLATE = `---
specLevel: domain
title: Domain title
description: One-sentence scope statement.
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
relatedTopics: []
---

## Scope and boundaries
What this domain governs, and explicitly what it does NOT.

## Terminology
Domain-specific terms with definitions. Each term MUST appear here before use elsewhere.

## Architectural principles
The invariants and design rules that hold across every area/feature in this domain.

## Area map
Navigable list of child areas with one-sentence responsibilities.

## Normative guarantees
The guarantees implementations MUST provide within this domain.

## Conformance evidence
How an implementation proves it conforms to this domain (test corpus, anchors).

## Change policy
Stability tier, breaking-change rules, and deprecation policy for this domain.

## Related domains
Cross-domain dependencies and links.
`;

export const DEFAULT_AREA_TEMPLATE = `---
specLevel: area
title: Area title
description: One-sentence area scope.
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
relatedTopics: []
---

## Area contract
The responsibility boundary this area owns within its parent domain.

## Responsibility boundaries
What this area does vs. what sibling areas do. Explicit non-responsibilities.

## Internal model
The conceptual model (data shapes, state machines, pipelines) this area assumes.

## Feature index
Canonical feature pages under this area.

## Failure and diagnostics model
How failures surface, which diagnostic codes this area owns, and the error taxonomy.

## Verification matrix
Table mapping each feature to its conformance test and anchor location.

## Operational guidance
Runtime/ops considerations: performance, resource limits, and observability hooks.

## Related areas
Sibling and upstream/downstream links.
`;

export const DEFAULT_FEATURE_TEMPLATE = `---
specLevel: feature
title: Feature title
status: Proposed
description: One-sentence feature scope.
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
relatedTopics: []
---

## Contract statement
The normative behavior this feature mandates, in one paragraph.

## Inputs and outputs
What the feature consumes and produces (syntax, data, artifacts).

## State model
Mutable state, lifetimes, and ownership. State "N/A" explicitly if stateless.

## Algorithms and flow
The algorithm or pipeline this feature implements, with ordering rules.

## Edge cases and errors
Numbered edge cases plus the diagnostic each MUST raise.

## Compatibility and versioning
Stability tier, backward-compat rules, and migration path on change.

## Security and performance notes
Threat-model considerations, performance characteristics, and resource bounds.

## Examples
Normative examples that MUST stay valid.

## Verification and traceability
How conformance is proven; test anchors.

## Related features
Direct dependencies and sibling contracts.

## Decisions
The decision summary below is generated from the hub's \`adr/\` directory.
<!-- spec:generate:adr-index -->
<!-- /spec:generate:adr-index -->
`;

export const DEFAULT_ARTICLE_TEMPLATE = `---
specLevel: article
title: Article title
description: One-sentence article purpose.
status: Proposed
lastReviewed: 2026-06-19
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
relatedTopics: []
---

## Purpose and scope
What this article covers and why it exists as a standalone article (not folded into its feature hub).

## Canonical references
The normative sources this article explains/operationalizes (pest rules, crate paths, ADRs).

## Detailed behavior
The article's substance — algorithm walkthrough, contract table, or procedure.

## Verification and maintenance notes
How to keep this article accurate; test anchors; last-reviewed discipline.

## Related topics
At minimum one parent or sibling link.
`;

export const DEFAULT_ADR_TEMPLATE = `---
specLevel: adr
adrId: DOMAIN-AREA-0001
adrStatus: Proposed
adrDate: 2026-06-19
title: Decision title
owner:
  name: Maintainer
  email: maintainer@example.com
submitter:
  name: Maintainer
  email: maintainer@example.com
relatedTopics: []
---

## Context
The forces at play when this decision was made. Problems, constraints, and prior art.

## Decision
The change being made or the normative rule being asserted, stated plainly.

## Consequences
What becomes easier, harder, or newly required. Verification anchors.
`;

export function ensureDefaultTemplates(workspaceDir: string): void {
	const dir = path.join(workspaceDir, SPEC_TEMPLATES_DIR);
	fs.mkdirSync(dir, { recursive: true });
	const files: Array<[string, string]> = [
		[DOMAIN_TEMPLATE_FILE, DEFAULT_DOMAIN_TEMPLATE],
		[AREA_TEMPLATE_FILE, DEFAULT_AREA_TEMPLATE],
		[FEATURE_TEMPLATE_FILE, DEFAULT_FEATURE_TEMPLATE],
		[ARTICLE_TEMPLATE_FILE, DEFAULT_ARTICLE_TEMPLATE],
		[ADR_TEMPLATE_FILE, DEFAULT_ADR_TEMPLATE],
	];
	for (const [name, content] of files) {
		const file = path.join(dir, name);
		if (!fs.existsSync(file)) {
			fs.writeFileSync(file, content);
		}
	}
}
