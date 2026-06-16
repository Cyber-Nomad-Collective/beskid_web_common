import type { SpecLevel } from "./workspace/schema.js";
import type { PathClass } from "./path-rules.js";

/** Classify a normative JSON workspace directory path (relative to content root). */
export function pathClassFromNodeRel(relPosix: string): PathClass {
	const segments = relPosix.split("/").filter(Boolean);
	if (segments.length === 0) return "domain-root";

	const adrIdx = segments.indexOf("adr");
	if (adrIdx !== -1 && segments.length > adrIdx + 1) return "adr";

	const articlesIdx = segments.indexOf("articles");
	if (articlesIdx !== -1 && segments.length > articlesIdx + 1) return "article";

	if (segments.length === 1) return "domain";
	if (segments.length === 2) return "area";
	if (segments.length === 3) return "feature";
	return "legacy-or-bridge";
}

export function parentSlugFromNodeRel(
	relPosix: string,
	pathClass: PathClass,
): string | null {
	const segments = relPosix.split("/").filter(Boolean);
	if (segments.length === 0) return null;

	if (pathClass === "adr") {
		const adrIdx = segments.indexOf("adr");
		const hubRel = segments.slice(0, adrIdx).join("/");
		return hubRel ? `platform-spec/${hubRel}` : "platform-spec";
	}

	if (pathClass === "article") {
		const articlesIdx = segments.indexOf("articles");
		const hubRel = segments.slice(0, articlesIdx).join("/");
		return hubRel ? `platform-spec/${hubRel}` : "platform-spec";
	}

	if (pathClass === "domain-root" || pathClass === "domain") return "platform-spec";
	if (pathClass === "area") return `platform-spec/${segments[0]}`;
	if (pathClass === "feature") {
		return `platform-spec/${segments.slice(0, -1).join("/")}`;
	}

	const parentRel = segments.slice(0, -1).join("/");
	return parentRel ? `platform-spec/${parentRel}` : "platform-spec";
}

export function nodeRelForLevel(slug: string, specLevel: SpecLevel): string {
	const rel = slug.replace(/^platform-spec\/?/, "");
	if (!rel) return "";

	const parts = rel.split("/");
	const leaf = parts.pop()!;
	const hub = parts.join("/");

	if (specLevel === "article") {
		if (rel.includes("/articles/")) return rel;
		return hub ? `${hub}/articles/${leaf}` : `articles/${leaf}`;
	}

	if (specLevel === "adr") {
		if (rel.includes("/adr/")) return rel;
		return hub ? `${hub}/adr/${leaf}` : `adr/${leaf}`;
	}

	return rel;
}

export function isHubLevel(specLevel: SpecLevel): boolean {
	return (
		specLevel === "root" ||
		specLevel === "domain" ||
		specLevel === "area" ||
		specLevel === "feature"
	);
}

export const HUB_CHILD_CONTAINER_DIRS = ["articles", "adr"] as const;
