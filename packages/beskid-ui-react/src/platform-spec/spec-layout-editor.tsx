"use client";

import { useCallback, useMemo, useState } from "react";
import ReactGridLayout, { useContainerWidth, verticalCompactor } from "react-grid-layout";
import {
	ensureGridLayout,
	layoutFileWithGrid,
	type GridLayoutItem,
	type LayoutFile,
	type WidgetSpec,
} from "@cyber-nomad-collective/spec-core";
import { Button } from "../components/ui/button.js";
import { BUILTIN_WIDGET_REGISTRY, widgetRegistryMap } from "./registry.js";
import type { SpecWidgetRegistration } from "./types.js";
import "react-grid-layout/css/styles.css";

export interface SpecLayoutEditorProps {
	layout: LayoutFile;
	onChange: (next: LayoutFile) => void;
	registry?: SpecWidgetRegistration[];
}

export function SpecLayoutEditor({
	layout,
	onChange,
	registry = BUILTIN_WIDGET_REGISTRY,
}: SpecLayoutEditorProps) {
	const { width, containerRef, mounted } = useContainerWidth();
	const map = useMemo(() => widgetRegistryMap(registry), [registry]);
	const grid = ensureGridLayout(layout);
	const [selectedId, setSelectedId] = useState<string | null>(
		grid.items[0]?.i ?? null,
	);

	const selectedItem = grid.items.find((item) => item.i === selectedId) ?? null;
	const selectedRegistration = selectedItem
		? map.get(selectedItem.widget.type)
		: null;

	const commitGrid = useCallback(
		(items: GridLayoutItem[]) => {
			onChange(
				layoutFileWithGrid({
					...layout,
					grid: { ...grid, items },
				}),
			);
		},
		[grid, layout, onChange],
	);

	const handleLayoutChange = useCallback(
		(nextLayout: readonly { i: string; x: number; y: number; w: number; h: number }[]) => {
			const items = grid.items.map((item) => {
				const updated = nextLayout.find((l) => l.i === item.i);
				if (!updated) return item;
				return { ...item, ...updated };
			});
			commitGrid(items);
		},
		[commitGrid, grid.items],
	);

	const addWidget = (type: string) => {
		const registration = map.get(type);
		if (!registration) return;
		let widget: WidgetSpec;
		if (type === "domainTiles") {
			const parsed = registration.propsSchema.safeParse({
				pathPrefix: layout.pathPrefix ?? "platform-spec",
				heading: "Explore",
			});
			if (!parsed.success) return;
			widget = {
				type: "domainTiles",
				props: parsed.data as { pathPrefix: string; heading: string },
			};
		} else if (type === "twoColumn") {
			widget = {
				type: "twoColumn",
				props: { gap: "md", left: [], right: [] },
			} as WidgetSpec;
		} else {
			return;
		}
		const maxY = grid.items.reduce((y, item) => Math.max(y, item.y + item.h), 0);
		const newItem: GridLayoutItem = {
			i: `widget-${Date.now()}`,
			x: 0,
			y: maxY,
			w: registration.defaultGridItem.w,
			h: registration.defaultGridItem.h,
			minW: registration.defaultGridItem.minW,
			minH: registration.defaultGridItem.minH,
			widget,
		};
		commitGrid([...grid.items, newItem]);
		setSelectedId(newItem.i);
	};

	return (
		<div className="grid gap-4 lg:grid-cols-[1fr_320px]">
			<div ref={containerRef}>
				{mounted ? (
					<ReactGridLayout
						className="spec-layout-editor"
						width={width}
						layout={grid.items.map((item) => ({
							i: item.i,
							x: item.x,
							y: item.y,
							w: item.w,
							h: item.h,
							minW: item.minW,
							minH: item.minH,
						}))}
						gridConfig={{
							cols: grid.cols,
							rowHeight: grid.rowHeight,
							margin: [12, 12] as const,
						}}
						dragConfig={{ enabled: true, handle: ".spec-grid-drag-handle" }}
						resizeConfig={{ enabled: true }}
						compactor={verticalCompactor}
						onLayoutChange={handleLayoutChange}
					>
						{grid.items.map((item) => (
							<button
								key={item.i}
								type="button"
								className={`spec-grid-drag-handle h-full w-full rounded-lg border p-2 text-left ${
									selectedId === item.i
										? "border-primary ring-2 ring-primary/30"
										: "border-border/60"
								}`}
								onClick={() => setSelectedId(item.i)}
							>
								<span className="text-xs font-medium uppercase text-muted-foreground">
									{item.widget.type}
								</span>
							</button>
						))}
					</ReactGridLayout>
				) : null}
			</div>
			<aside className="space-y-4 rounded-lg border border-border/70 p-4">
				<div className="flex flex-wrap gap-2">
					{registry.map((entry) => (
						<Button
							key={entry.type}
							type="button"
							variant="outline"
							size="sm"
							onClick={() => addWidget(entry.type)}
						>
							Add {entry.type}
						</Button>
					))}
				</div>
				{selectedItem && selectedRegistration ? (
					<selectedRegistration.Editor
						props={
							selectedItem.widget.type === "domainTiles"
								? selectedItem.widget.props
								: selectedItem.widget.type === "twoColumn"
									? selectedItem.widget.props
									: (selectedItem.widget as never)
						}
						onChange={(next) => {
							const items: GridLayoutItem[] = grid.items.map((item) => {
								if (item.i !== selectedItem.i) return item;
								if (item.widget.type === "domainTiles") {
									return {
										...item,
										widget: {
											type: "domainTiles" as const,
											props: next as { pathPrefix: string; heading: string },
										},
									};
								}
								if (item.widget.type === "twoColumn") {
									return {
										...item,
										widget: {
											type: "twoColumn" as const,
											props: next as WidgetSpec extends { type: "twoColumn" }
												? WidgetSpec["props"]
												: never,
										},
									};
								}
								return item;
							});
							commitGrid(items);
						}}
					/>
				) : (
					<p className="text-sm text-muted-foreground">
						Select a grid item to edit its properties.
					</p>
				)}
				{selectedItem ? (
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={() => {
							commitGrid(grid.items.filter((item) => item.i !== selectedItem.i));
							setSelectedId(null);
						}}
					>
						Remove widget
					</Button>
				) : null}
			</aside>
		</div>
	);
}
