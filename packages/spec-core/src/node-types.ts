import type { SpecLevel, WorkspaceManifest } from "./workspace/schema.js";

/** PascalCase CLI flags map to internal spec levels. */
export const NODE_TYPE_LABELS: Record<SpecLevel, string> = {
	root: "Root",
	domain: "Domain",
	area: "Area",
	feature: "Feature",
	article: "Article",
	adr: "ADR",
};

const LABEL_TO_LEVEL = Object.fromEntries(
	(Object.entries(NODE_TYPE_LABELS) as [SpecLevel, string][]).map(
		([level, label]) => [label.toLowerCase(), level],
	),
) as Record<string, SpecLevel>;

export function specLevelFromTypeFlag(typeFlag: string): SpecLevel | undefined {
	const normalized = typeFlag.trim();
	if (!normalized) return undefined;

	const lower = normalized.toLowerCase();
	if (lower in LABEL_TO_LEVEL) {
		return LABEL_TO_LEVEL[lower];
	}

	const asLevel = lower as SpecLevel;
	if (asLevel in NODE_TYPE_LABELS) {
		return asLevel;
	}

	return undefined;
}

export function nodeTypeLabel(
	manifest: WorkspaceManifest,
	level: SpecLevel,
): string {
	return manifest.nodeTypes[level]?.label ?? NODE_TYPE_LABELS[level];
}

export function allowedChildTypeFlags(
	manifest: WorkspaceManifest,
	parentLevel: SpecLevel,
): string[] {
	const childLevels = manifest.nodeTypes[parentLevel]?.childLevels ?? [];
	return childLevels.map((level) => nodeTypeLabel(manifest, level));
}
