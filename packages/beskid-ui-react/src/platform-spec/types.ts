import type { ContentBlock, GridLayout, LayoutFile } from "@cyber-nomad-collective/spec-core";
import type { GridLayoutItem, WidgetSpec } from "@cyber-nomad-collective/spec-core";
import type { z } from "zod";
import type { ComponentType } from "react";

export interface CatalogEntry {
	slug: string;
	href: string;
	title: string;
	description?: string | null;
	status?: string | null;
	pathClass?: string | null;
}

export interface NavTreeNode {
	slug: string;
	href: string;
	title: string;
	children?: NavTreeNode[];
}

export interface WidgetViewProps<T = unknown> {
	props: T;
	contentBlock?: ContentBlock;
	catalogEntries?: CatalogEntry[];
}

export interface WidgetEditorProps<T = unknown> {
	props: T;
	onChange: (next: T) => void;
}

export interface SpecWidgetRegistration<T = unknown> {
	type: string;
	View: ComponentType<WidgetViewProps<T>>;
	Editor: ComponentType<WidgetEditorProps<T>>;
	propsSchema: z.ZodType<T>;
	defaultGridItem: { w: number; h: number; minW?: number; minH?: number };
}

export interface SpecDocumentModel {
	title: string;
	description?: string | null;
	specLevel?: string | null;
	status?: string | null;
	slug: string;
	layout?: LayoutFile | null;
	contentBlocks?: ContentBlock[];
	bodyHtml?: string;
	relatedTopics?: { href: string; title: string }[];
}

export type { GridLayout, GridLayoutItem, LayoutFile, WidgetSpec, ContentBlock };
