import { z } from "zod";
import type { SpecWidgetRegistration } from "./types.js";
import { DomainTilesEditor, DomainTilesView } from "./widgets/domain-tiles.js";
import { MarkdownProseEditor, MarkdownProseView } from "./widgets/markdown-prose.js";
import { SpecSectionEditor, SpecSectionView } from "./widgets/spec-section.js";
import { TwoColumnEditor, TwoColumnView } from "./widgets/two-column.js";

const domainTilesPropsSchema = z.object({
	pathPrefix: z.string().min(1),
	heading: z.string().default("Explore"),
});

const specSectionPropsSchema = z.object({
	id: z.string().min(1),
	title: z.string().optional(),
	bodyMd: z.string().default(""),
});

const markdownProsePropsSchema = z.object({
	bodyMd: z.string().default(""),
});

const twoColumnPropsSchema = z.object({
	gap: z.enum(["sm", "md", "lg"]).default("md"),
	left: z.array(z.unknown()),
	right: z.array(z.unknown()),
});

export const BUILTIN_WIDGET_REGISTRY: SpecWidgetRegistration[] = [
	{
		type: "domainTiles",
		View: DomainTilesView as SpecWidgetRegistration["View"],
		Editor: DomainTilesEditor as SpecWidgetRegistration["Editor"],
		propsSchema: domainTilesPropsSchema,
		defaultGridItem: { w: 12, h: 4, minW: 4, minH: 2 },
	},
	{
		type: "specSection",
		View: SpecSectionView as SpecWidgetRegistration["View"],
		Editor: SpecSectionEditor as SpecWidgetRegistration["Editor"],
		propsSchema: specSectionPropsSchema,
		defaultGridItem: { w: 12, h: 3, minW: 4, minH: 2 },
	},
	{
		type: "markdownProse",
		View: MarkdownProseView as SpecWidgetRegistration["View"],
		Editor: MarkdownProseEditor as SpecWidgetRegistration["Editor"],
		propsSchema: markdownProsePropsSchema,
		defaultGridItem: { w: 12, h: 4, minW: 4, minH: 2 },
	},
	{
		type: "twoColumn",
		View: TwoColumnView as SpecWidgetRegistration["View"],
		Editor: TwoColumnEditor as SpecWidgetRegistration["Editor"],
		propsSchema: twoColumnPropsSchema,
		defaultGridItem: { w: 12, h: 4, minW: 6, minH: 2 },
	},
];

export function widgetRegistryMap(
	registry: SpecWidgetRegistration[] = BUILTIN_WIDGET_REGISTRY,
): Map<string, SpecWidgetRegistration> {
	return new Map(registry.map((entry) => [entry.type, entry]));
}
