import {
	layoutContractFileSchema,
	widgetSpecSchema,
	type LayoutContractFile,
	type WidgetSpec,
} from "@cyber-nomad-collective/trudoc/layout";
import { z } from "zod";

export const gridLayoutItemSchema = z.object({
	i: z.string().min(1),
	x: z.number().int().nonnegative(),
	y: z.number().int().nonnegative(),
	w: z.number().int().positive(),
	h: z.number().int().positive(),
	minW: z.number().int().positive().optional(),
	maxW: z.number().int().positive().optional(),
	minH: z.number().int().positive().optional(),
	maxH: z.number().int().positive().optional(),
	static: z.boolean().optional(),
	widget: widgetSpecSchema,
});

export type GridLayoutItem = z.infer<typeof gridLayoutItemSchema>;

export const gridLayoutSchema = z.object({
	cols: z.number().int().positive().default(12),
	rowHeight: z.number().int().positive().default(30),
	items: z.array(gridLayoutItemSchema),
});

export type GridLayout = z.infer<typeof gridLayoutSchema>;

export const layoutFileSchema = layoutContractFileSchema.extend({
	grid: gridLayoutSchema.optional(),
});

export type LayoutFile = z.infer<typeof layoutFileSchema>;

export function parseLayoutFile(raw: unknown, context: string): LayoutFile {
	const parsed = layoutFileSchema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("; ");
		throw new Error(`${context}: invalid layout — ${msg}`);
	}
	return parsed.data;
}

/** Auto-place v1 `widgets[]` onto a 12-column grid (stacked vertically). */
export function widgetsToGrid(
	widgets: WidgetSpec[],
	cols = 12,
): GridLayout {
	const items: GridLayoutItem[] = [];
	let y = 0;

	for (const [index, widget] of widgets.entries()) {
		const h =
			widget.type === "twoColumn" ? 6 : widget.type === "domainTiles" ? 4 : 3;
		items.push({
			i: `widget-${index}`,
			x: 0,
			y,
			w: cols,
			h,
			widget,
		});
		y += h;
	}

	return { cols, rowHeight: 30, items };
}

/** Extract v1 widgets from grid items (preserves order by y then x). */
export function gridToWidgets(grid: GridLayout): WidgetSpec[] {
	return [...grid.items]
		.sort((a, b) => a.y - b.y || a.x - b.x)
		.map((item) => item.widget);
}

export function ensureGridLayout(layout: LayoutFile): GridLayout {
	if (layout.grid) return layout.grid;
	const widgets = layout.widgets ?? [];
	return widgetsToGrid(widgets);
}

export function layoutFileWithGrid(layout: LayoutFile): LayoutFile {
	const grid = ensureGridLayout(layout);
	return {
		...layout,
		widgets: layout.widgets ?? gridToWidgets(grid),
		grid,
	};
}

export function serializeLayoutTemplate(layout: LayoutFile): string {
	return JSON.stringify(layoutFileWithGrid(layout), null, 2);
}

export type { LayoutContractFile, WidgetSpec };
