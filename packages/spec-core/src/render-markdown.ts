import { parseMarkdownSections, type MarkdownSection } from "./markdown-content.js";
import type { LayoutFile, WidgetSpec } from "./grid-layout.js";

export interface RenderedSpecSection {
	id: string;
	title: string;
	html: string;
	bodyMd: string;
}

export interface RenderedSpecDocument {
	title: string;
	sections: RenderedSpecSection[];
	bodyMd: string;
}

export function sectionsForLayout(
	layout: LayoutFile | null | undefined,
	markdown: string,
): MarkdownSection[] {
	const parsed = parseMarkdownSections(markdown);
	if (!layout?.widgets?.length) {
		return parsed;
	}

	const sectionWidgets = (layout.widgets ?? []).filter(
		(widget): widget is WidgetSpec & { type: "specSection"; props?: { id?: string } } =>
			(widget as { type: string }).type === "specSection",
	);
	if (sectionWidgets.length === 0) {
		return parsed;
	}

	const byId = new Map(parsed.map((section) => [section.id, section]));
	const ordered: MarkdownSection[] = [];

	for (const widget of sectionWidgets) {
		const props = (widget as { props?: { id?: string } }).props;
		const id = props?.id ? String(props.id) : "";
		if (!id) continue;
		const section = byId.get(id);
		if (section) ordered.push(section);
	}

	return ordered.length > 0 ? ordered : parsed;
}

export function renderSpecDocument(input: {
	title: string;
	bodyMd: string;
	layout?: LayoutFile | null;
	renderMarkdown: (markdown: string) => string;
}): RenderedSpecDocument {
	const sections = sectionsForLayout(input.layout, input.bodyMd).map(
		(section) => ({
			id: section.id,
			title: section.title,
			bodyMd: section.body,
			html: input.renderMarkdown(section.body),
		}),
	);

	return {
		title: input.title,
		bodyMd: input.bodyMd,
		sections,
	};
}
