/** Generated-region markers in feature hub content.md */

export const GENERATE_ADR_INDEX_OPEN = "<!-- spec:generate:adr-index -->";
export const GENERATE_ADR_INDEX_CLOSE = "<!-- /spec:generate:adr-index -->";
export const GENERATE_ARTICLE_INDEX_OPEN =
	"<!-- spec:generate:article-index -->";
export const GENERATE_ARTICLE_INDEX_CLOSE =
	"<!-- /spec:generate:article-index -->";

export interface HubChildAdr {
	dirName: string;
	adrId: string;
	adrStatus: string;
	title: string;
}

export interface HubChildArticle {
	dirName: string;
	title: string;
}

function replaceGeneratedRegion(
	markdown: string,
	open: string,
	close: string,
	content: string,
): string {
	const re = new RegExp(
		`${escapeRegExp(open)}[\\s\\S]*?${escapeRegExp(close)}`,
		"m",
	);
	if (re.test(markdown)) {
		return markdown.replace(re, `${open}\n${content.trim()}\n${close}`);
	}
	return markdown;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renderAdrIndexSummary(adrs: HubChildAdr[]): string {
	if (adrs.length === 0) {
		return "No ADRs published under **`adr/`** yet.";
	}

	const open = adrs.filter(
		(a) => !["accepted", "superseded", "deprecated", "rejected"].includes(
			a.adrStatus.toLowerCase(),
		),
	);
	const ids = adrs.map((a) => `\`${a.adrId}\``);
	const idRange =
		ids.length === 1
			? ids[0]!
			: `${ids[0]} … ${ids[ids.length - 1]}`;

	if (open.length === 0) {
		return `No open decisions. Closed choices are normative ADRs under **\`adr/\`** (${idRange}); use the reader **ADRs** tab for expandable detail.`;
	}

	return `${open.length} open decision(s). Normative ADRs under **\`adr/\`** (${idRange}); use the reader **ADRs** tab for expandable detail.`;
}

export function renderArticleIndex(articles: HubChildArticle[]): string {
	if (articles.length === 0) {
		return "_No articles in this bundle yet._";
	}
	return articles
		.map((a) => {
			const label = a.title || a.dirName.replace(/-/g, " ");
			return `- [${label}](./articles/${a.dirName}/)`;
		})
		.join("\n");
}

export function applyGeneratedHubSections(
	markdown: string,
	adrs: HubChildAdr[],
	articles: HubChildArticle[],
): string {
	let next = replaceGeneratedRegion(
		markdown,
		GENERATE_ADR_INDEX_OPEN,
		GENERATE_ADR_INDEX_CLOSE,
		renderAdrIndexSummary(adrs),
	);
	next = replaceGeneratedRegion(
		next,
		GENERATE_ARTICLE_INDEX_OPEN,
		GENERATE_ARTICLE_INDEX_CLOSE,
		renderArticleIndex(articles),
	);
	return next;
}

export function stripHandAuthoredHubLists(body: string): string {
	// Remove legacy hand-maintained article bullets after ## Decisions
	return body
		.replace(
			/(## Decisions[\s\S]*?)(?:\n\n)?(- \[[^\]]+\]\(\.\/[^)]+\/\)\n?)+/m,
			"$1\n",
		)
		.trim();
}

export function ensureHubGenerateMarkers(body: string): string {
	let next = body;
	if (!next.includes(GENERATE_ADR_INDEX_OPEN)) {
		const decisionsHeading = "## Decisions";
		if (next.includes(decisionsHeading)) {
			next = next.replace(
				decisionsHeading,
				`${decisionsHeading}\n${GENERATE_ADR_INDEX_OPEN}\n${GENERATE_ADR_INDEX_CLOSE}`,
			);
		} else {
			next = `${next.trim()}\n\n## Decisions\n${GENERATE_ADR_INDEX_OPEN}\n${GENERATE_ADR_INDEX_CLOSE}\n`;
		}
	}
	if (!next.includes(GENERATE_ARTICLE_INDEX_OPEN)) {
		next = `${next.trim()}\n\n## Articles\n${GENERATE_ARTICLE_INDEX_OPEN}\n${GENERATE_ARTICLE_INDEX_CLOSE}\n`;
	}
	return next;
}

export function validateGeneratedRegions(body: string): string[] {
	const errors: string[] = [];
	for (const [name, open, close] of [
		["adr-index", GENERATE_ADR_INDEX_OPEN, GENERATE_ADR_INDEX_CLOSE],
		["article-index", GENERATE_ARTICLE_INDEX_OPEN, GENERATE_ARTICLE_INDEX_CLOSE],
	] as const) {
		const openIdx = body.indexOf(open);
		const closeIdx = body.indexOf(close);
		if (openIdx === -1 && closeIdx === -1) continue;
		if (openIdx === -1 || closeIdx === -1 || closeIdx < openIdx) {
			errors.push(`Malformed generated region ${name}`);
		}
	}
	return errors;
}
