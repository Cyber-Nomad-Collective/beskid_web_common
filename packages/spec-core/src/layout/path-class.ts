/**
 * Path classifier, ported from trudoc/src/layout/path-class.ts.
 * Replaces spec-core imports of @cyber-nomad-collective/trudoc/layout classifyPlatformSpecRel.
 *
 * Depends on the PathClass type from ./schema.js (type-only — no runtime cycle).
 * path-rules.ts re-exports PathClass for backward compatibility with consumers.
 */
import type { PathClass } from "./schema.js";

export function classifyPlatformSpecRel(relPosix: string): PathClass {
	const segments = relPosix.split("/").filter(Boolean);
	const base = segments.at(-1)?.replace(/\.(md|mdx)$/i, "") ?? "";
	const isIndex = base === "index";

	if (segments.length === 1 && isIndex) return "domain-root";
	if (segments.length === 2 && isIndex) return "domain";
	if (segments.length === 3 && isIndex) return "area";
	if (segments.length === 4 && isIndex) return "feature";
	/** Area-level articles: non-`index` leaf directly under an area hub. */
	if (segments.length === 3 && !isIndex) return "article";
	/** Feature ADRs: leaf under `<feature>/adr/`. */
	if (segments.length >= 5 && segments.at(-2) === "adr" && !isIndex)
		return "adr";
	/** Feature-bundle articles: non-`index` leaf under a feature folder (not under `adr/`). */
	if (segments.length >= 4 && !isIndex && segments.at(-2) !== "adr")
		return "article";
	return "legacy-or-bridge";
}
