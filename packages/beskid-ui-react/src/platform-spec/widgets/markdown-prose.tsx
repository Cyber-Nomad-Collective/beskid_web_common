import type { WidgetEditorProps, WidgetViewProps } from "../types.js";
import { Label } from "../../components/ui/label.js";
import { Textarea } from "../../components/ui/textarea.js";

export function MarkdownProseView({
	props,
}: WidgetViewProps<{ bodyMd: string }>) {
	return (
		<div className="spec-prose whitespace-pre-wrap text-sm leading-relaxed">
			{props.bodyMd}
		</div>
	);
}

export function MarkdownProseEditor({
	props,
	onChange,
}: WidgetEditorProps<{ bodyMd: string }>) {
	return (
		<div className="grid gap-1">
			<Label htmlFor="prose-body">Prose (markdown)</Label>
			<Textarea
				id="prose-body"
				rows={8}
				value={props.bodyMd}
				onChange={(e) => onChange({ ...props, bodyMd: e.target.value })}
			/>
		</div>
	);
}
