"use client";

import { useMemo, useState } from "react";

export interface SpecContentEditorProps {
	bodyMd: string;
	onChange: (bodyMd: string) => void;
	disabled?: boolean;
}

export function SpecContentEditor({
	bodyMd,
	onChange,
	disabled = false,
}: SpecContentEditorProps) {
	const [mode, setMode] = useState<"view" | "edit">("view");
	const previewHtml = useMemo(
		() =>
			bodyMd
				.split("\n")
				.map((line) =>
					line.startsWith("## ")
						? `<h2>${line.slice(3)}</h2>`
						: `<p>${line || "&nbsp;"}</p>`,
				)
				.join(""),
		[bodyMd],
	);

	return (
		<div className="space-y-3">
			<div className="flex gap-2">
				<button
					type="button"
					className={`rounded-md px-3 py-1 text-sm ${mode === "view" ? "bg-primary text-primary-foreground" : "border"}`}
					onClick={() => setMode("view")}
				>
					View content
				</button>
				<button
					type="button"
					className={`rounded-md px-3 py-1 text-sm ${mode === "edit" ? "bg-primary text-primary-foreground" : "border"}`}
					onClick={() => setMode("edit")}
					disabled={disabled}
				>
					Edit content
				</button>
			</div>
			{mode === "edit" ? (
				<textarea
					className="min-h-64 w-full rounded-md border px-3 py-2 font-mono text-sm"
					value={bodyMd}
					onChange={(event) => onChange(event.target.value)}
					disabled={disabled}
				/>
			) : (
				<div
					className="prose prose-invert max-w-none rounded-md border p-4"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: markdown preview
					dangerouslySetInnerHTML={{ __html: previewHtml }}
				/>
			)}
		</div>
	);
}
