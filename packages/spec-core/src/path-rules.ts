import path from "node:path";
import { classifyPlatformSpecRel } from "@cyber-nomad-collective/trudoc/layout";
import {
	nodeRelForLevel,
	parentSlugFromNodeRel,
	pathClassFromNodeRel,
} from "./node-path.js";
import type { SpecLevel } from "./workspace/schema.js";

export type PathClass =
	| "domain-root"
	| "domain"
	| "area"
	| "feature"
	| "article"
	| "adr"
	| "legacy-or-bridge"
	| "component";

const LEGACY_SPEC_MARKER = "src/content/docs/platform-spec/";

export function pathClassFromRel(relPosix: string): PathClass {
	return classifyPlatformSpecRel(relPosix.replace(/\.(md|mdx)$/i, ""));
}

export function pathClassFromRepoPath(repoPath: string): PathClass {
	const idx = repoPath.indexOf(LEGACY_SPEC_MARKER);
	if (idx === -1) return "legacy-or-bridge";
	const rel = repoPath.slice(idx + LEGACY_SPEC_MARKER.length);
	return pathClassFromRel(rel);
}

export function specRelFromRepoPath(repoPath: string): string {
	const idx = repoPath.indexOf(LEGACY_SPEC_MARKER);
	if (idx === -1) return repoPath.replace(/\.(md|mdx)$/i, "");
	return repoPath.slice(idx + LEGACY_SPEC_MARKER.length).replace(/\.(md|mdx)$/i, "");
}

export function repoPathFromSpecRel(
	rel: string,
	ext: "mdx" | "md" = "mdx",
): string {
	const normalized = rel.replace(/\\/g, "/").replace(/^\//, "");
	return `site/website/src/content/docs/platform-spec/${normalized}${normalized.endsWith(`.${ext}`) ? "" : `.${ext}`}`;
}

/** Paths inside the normative spec repository (no website prefix). */
export function normativeRepoPathFromNodeRel(
	nodeRel: string,
	fileName: string,
): string {
	const normalized = nodeRel.replace(/\\/g, "/").replace(/^\//, "");
	return `${normalized}/${fileName}`;
}

export function normativePathsForSlug(slug: string): {
	nodeJson: string;
	layoutJson: string;
	contentMd: string;
	commentsJson: string;
} {
	const rel = slug.replace(/^platform-spec\/?/, "platform-spec");
	const base = rel === "platform-spec" ? "platform-spec" : rel;
	return {
		nodeJson: normativeRepoPathFromNodeRel(base, "node.json"),
		layoutJson: normativeRepoPathFromNodeRel(base, "layout.json"),
		contentMd: normativeRepoPathFromNodeRel(base, "content.md"),
		commentsJson: normativeRepoPathFromNodeRel(base, "comments.json"),
	};
}

export function slugFromSpecRel(rel: string): string {
	const normalized = rel.replace(/\\/g, "/").replace(/^\//, "").replace(/\/index$/, "");
	return normalized.startsWith("platform-spec/")
		? normalized.replace(/\.(md|mdx)$/i, "")
		: `platform-spec/${normalized.replace(/\.(md|mdx)$/i, "")}`;
}

export function slugFromRepoPath(repoPath: string): string {
	return slugFromSpecRel(specRelFromRepoPath(repoPath));
}

export function parentSlugFromPath(
	slug: string,
	pathClass: PathClass,
): string | null {
	if (slug === "platform-spec") return null;
	const parts = slug.split("/").filter(Boolean);
	if (pathClass === "domain" || pathClass === "domain-root")
		return "platform-spec";
	if (pathClass === "area") return parts.slice(0, 2).join("/");
	if (pathClass === "feature") return parts.slice(0, 3).join("/");
	if (pathClass === "article" || pathClass === "adr") {
		return parts.slice(0, -1).join("/");
	}
	return parts.slice(0, -1).join("/") || "platform-spec";
}

export function specLevelFromPathClass(pathClass: PathClass): SpecLevel {
	switch (pathClass) {
		case "domain-root":
			return "root";
		case "domain":
			return "domain";
		case "area":
			return "area";
		case "feature":
			return "feature";
		case "adr":
			return "adr";
		case "article":
			return "article";
		default:
			return "feature";
	}
}

export function validateSpecLevelPath(
	specLevel: string,
	repoPath: string,
): string | null {
	const pathClass = pathClassFromRepoPath(repoPath);
	const expected: Record<string, PathClass> = {
		domain: "domain",
		area: "area",
		feature: "feature",
		article: "article",
		adr: "adr",
		root: "domain-root",
	};
	const want = expected[specLevel];
	if (!want) return `Unknown specLevel: ${specLevel}`;
	if (
		pathClass !== want &&
		!(specLevel === "domain" && pathClass === "domain-root") &&
		!(specLevel === "root" && pathClass === "domain-root")
	) {
		return `Path class ${pathClass} does not match specLevel ${specLevel} for ${repoPath}`;
	}
	return null;
}

export function nodeDirFromSlug(
	contentRoot: string,
	slug: string,
	specLevel?: SpecLevel,
): string {
	const rel = slug.replace(/^platform-spec\/?/, "");
	if (!rel || rel === "platform-spec") return contentRoot;
	const nodeRel = specLevel ? nodeRelForLevel(slug, specLevel) : rel;
	return `${contentRoot}/${nodeRel}`;
}

export { pathClassFromNodeRel, parentSlugFromNodeRel, nodeRelForLevel };

export function slugFromNodeDir(
	contentRoot: string,
	nodeDir: string,
	workspaceDir?: string,
): string {
	const normalizedNodeDir = nodeDir.replace(/\\/g, "/").replace(/\/$/, "");
	let rel = normalizedNodeDir;

	if (workspaceDir) {
		const contentAbs = path.join(workspaceDir, contentRoot).replace(/\\/g, "/");
		if (normalizedNodeDir === contentAbs) {
			return "platform-spec";
		}
		if (normalizedNodeDir.startsWith(`${contentAbs}/`)) {
			rel = normalizedNodeDir.slice(contentAbs.length + 1);
		}
	} else {
		rel = normalizedNodeDir
			.replace(new RegExp(`^${contentRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?`), "")
			.replace(/\/$/, "");
	}

	if (!rel) return "platform-spec";
	return `platform-spec/${rel}`;
}
