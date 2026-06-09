import type { WidgetEditorProps, WidgetViewProps } from "../types.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { Textarea } from "../../components/ui/textarea.js";

export function SpecSectionView({
	props,
}: WidgetViewProps<{ id: string; title?: string; bodyMd: string }>) {
	return (
		<section id={props.id} className="spec-section space-y-3">
			{props.title ? (
				<h2 className="text-xl font-semibold">{props.title}</h2>
			) : null}
			<div className="spec-prose whitespace-pre-wrap text-sm leading-relaxed">
				{props.bodyMd}
			</div>
		</section>
	);
}

export function SpecSectionEditor({
	props,
	onChange,
}: WidgetEditorProps<{ id: string; title?: string; bodyMd: string }>) {
	return (
		<div className="grid gap-3">
			<div className="grid gap-1">
				<Label htmlFor="section-id">Section id</Label>
				<Input
					id="section-id"
					value={props.id}
					onChange={(e) => onChange({ ...props, id: e.target.value })}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="section-title">Title</Label>
				<Input
					id="section-title"
					value={props.title ?? ""}
					onChange={(e) =>
						onChange({ ...props, title: e.target.value || undefined })
					}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="section-body">Body (markdown)</Label>
				<Textarea
					id="section-body"
					rows={6}
					value={props.bodyMd}
					onChange={(e) => onChange({ ...props, bodyMd: e.target.value })}
				/>
			</div>
		</div>
	);
}
