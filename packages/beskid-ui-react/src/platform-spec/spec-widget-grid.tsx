"use client";

import { useMemo } from "react";
import ReactGridLayout, { useContainerWidth, verticalCompactor } from "react-grid-layout";
import { ensureGridLayout, type GridLayout } from "@cyber-nomad-collective/spec-core";
import type { LayoutFile } from "@cyber-nomad-collective/spec-core";
import { BUILTIN_WIDGET_REGISTRY, widgetRegistryMap } from "./registry.js";
import type { CatalogEntry, SpecWidgetRegistration } from "./types.js";
import "react-grid-layout/css/styles.css";

export interface SpecWidgetGridProps {
	layout: LayoutFile;
	catalogEntries?: CatalogEntry[];
	registry?: SpecWidgetRegistration[];
	className?: string;
}

export function SpecWidgetGrid({
	layout,
	catalogEntries = [],
	registry = BUILTIN_WIDGET_REGISTRY,
	className,
}: SpecWidgetGridProps) {
	const { width, containerRef, mounted } = useContainerWidth();
	const map = useMemo(() => widgetRegistryMap(registry), [registry]);
	const grid = ensureGridLayout(layout);

	return (
		<div ref={containerRef} className={className}>
			{mounted ? (
				<ReactGridLayout
					className="spec-widget-grid"
					width={width}
					layout={grid.items.map((item) => ({
						i: item.i,
						x: item.x,
						y: item.y,
						w: item.w,
						h: item.h,
						minW: item.minW,
						maxW: item.maxW,
						minH: item.minH,
						maxH: item.maxH,
						static: true,
					}))}
					gridConfig={{
						cols: grid.cols,
						rowHeight: grid.rowHeight,
						margin: [12, 12] as const,
					}}
					dragConfig={{ enabled: false }}
					resizeConfig={{ enabled: false }}
					compactor={verticalCompactor}
				>
					{grid.items.map((item) => {
						const widgetType = item.widget.type;
						const registration = map.get(widgetType);
						if (!registration) {
							return (
								<div key={item.i} className="rounded border border-dashed p-4 text-sm">
									Unknown widget: {widgetType}
								</div>
							);
						}
						const View = registration.View;
						const widgetProps =
							item.widget.type === "domainTiles" || item.widget.type === "twoColumn"
								? item.widget.props
								: item.widget;
						return (
							<div key={item.i} className="h-full overflow-auto rounded-lg border border-border/50 bg-card/40 p-4">
								<View props={widgetProps as never} catalogEntries={catalogEntries} />
							</div>
						);
					})}
				</ReactGridLayout>
			) : null}
		</div>
	);
}

export type { GridLayout };
