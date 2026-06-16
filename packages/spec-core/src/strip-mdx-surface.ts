/** Presentation-only Astro/MDX surface removed from normative `content.md`. */

const ASTRO_IMPORT_RE =
	/^import\s+[\w{},\s*]+\s+from\s+['"]@beskid\/beskid-ui\/[^'"]+\.astro['"];?\s*$/gm;

/** Hub chrome, ADR/article shells, layout tiles — metadata lives in node.json / layout.json. */
const PRESENTATION_COMPONENT_RE =
	/<(?:Spec(?:PageHeader|AdrChrome|ArticleChrome|OrAreaHub)|DomainTiles)\b[^>]*\/>|<(?:Spec(?:PageHeader|AdrChrome|ArticleChrome|OrAreaHub)|DomainTiles)\b[^>]*>[\s\S]*?<\/(?:Spec(?:PageHeader|AdrChrome|ArticleChrome|OrAreaHub)|DomainTiles)>/g;

const EXCESS_BLANK_LINES_RE = /\n{3,}/g;

export function stripAstroImports(markdown: string): string {
	return markdown.replace(ASTRO_IMPORT_RE, "");
}

export function stripPresentationComponents(markdown: string): string {
	return markdown.replace(PRESENTATION_COMPONENT_RE, "");
}

/** Remove Astro imports and presentation components; keep normative markdown and SpecSection bodies. */
export function stripMdxPresentationSurface(markdown: string): string {
	return stripPresentationComponents(stripAstroImports(markdown))
		.replace(EXCESS_BLANK_LINES_RE, "\n\n")
		.trim();
}
