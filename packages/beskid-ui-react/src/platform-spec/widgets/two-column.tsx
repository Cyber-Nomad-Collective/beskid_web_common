import type { WidgetEditorProps, WidgetViewProps } from "../types.js";

export function TwoColumnView({
	props,
}: WidgetViewProps<{ gap: "sm" | "md" | "lg"; left: unknown[]; right: unknown[] }>) {
	return (
		<div
			className={`grid gap-${props.gap === "lg" ? "6" : props.gap === "sm" ? "2" : "4"} md:grid-cols-2`}
		>
			<div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
				Left column ({props.left.length} widgets)
			</div>
			<div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
				Right column ({props.right.length} widgets)
			</div>
		</div>
	);
}

export function TwoColumnEditor({
	props,
	onChange,
}: WidgetEditorProps<{ gap: "sm" | "md" | "lg"; left: unknown[]; right: unknown[] }>) {
	return (
		<div className="text-sm text-muted-foreground">
			Two-column layout ({props.gap} gap). Edit nested widgets via grid items.
			<button
				type="button"
				className="ml-2 underline"
				onClick={() =>
					onChange({
						...props,
						gap: props.gap === "sm" ? "md" : props.gap === "md" ? "lg" : "sm",
					})
				}
			>
				Cycle gap
			</button>
		</div>
	);
}
