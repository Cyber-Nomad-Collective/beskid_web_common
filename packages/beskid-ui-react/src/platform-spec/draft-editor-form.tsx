"use client";

import type { ReactNode } from "react";

import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import { cn } from "../lib/utils.js";

export interface DraftEditorFormProps {
	title: string;
	summary: string;
	specLevel: string;
	changeKind: string;
	parentSlug: string;
	leafSlug: string;
	readOnly?: boolean;
	busy?: boolean;
	statusLine?: ReactNode;
	error?: string | null;
	layoutEditor: ReactNode;
	contentEditor: ReactNode;
	commentsPanel?: ReactNode;
	specLevels?: string[];
	changeKinds?: string[];
	onTitleChange: (value: string) => void;
	onSummaryChange: (value: string) => void;
	onSpecLevelChange: (value: string) => void;
	onChangeKindChange: (value: string) => void;
	onParentSlugChange: (value: string) => void;
	onLeafSlugChange: (value: string) => void;
	onSave?: () => void;
	onSubmit?: () => void;
	onDelete?: () => void;
	showSubmit?: boolean;
	showDelete?: boolean;
	header?: ReactNode;
	className?: string;
}

export function DraftEditorForm({
	title,
	summary,
	specLevel,
	changeKind,
	parentSlug,
	leafSlug,
	readOnly = false,
	busy = false,
	statusLine,
	error,
	layoutEditor,
	contentEditor,
	commentsPanel,
	specLevels = ["domain", "area", "feature", "article", "adr"],
	changeKinds = ["create", "update", "delete"],
	onTitleChange,
	onSummaryChange,
	onSpecLevelChange,
	onChangeKindChange,
	onParentSlugChange,
	onLeafSlugChange,
	onSave,
	onSubmit,
	onDelete,
	showSubmit = false,
	showDelete = false,
	header,
	className,
}: DraftEditorFormProps) {
	return (
		<div className={cn("mx-auto max-w-3xl space-y-6", className)}>
			{header}
			{statusLine}
			{error ? (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			) : null}

			<div className="grid gap-4">
				<div className="grid gap-1">
					<Label htmlFor="draft-title">Title</Label>
					<Input
						id="draft-title"
						value={title}
						onChange={(e) => onTitleChange(e.target.value)}
						disabled={readOnly}
					/>
				</div>
				<div className="grid gap-1">
					<Label htmlFor="draft-summary">Summary</Label>
					<textarea
						id="draft-summary"
						className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
						value={summary}
						onChange={(e) => onSummaryChange(e.target.value)}
						disabled={readOnly}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-1">
						<Label htmlFor="draft-level">Spec level</Label>
						<select
							id="draft-level"
							className="rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={specLevel}
							onChange={(e) => onSpecLevelChange(e.target.value)}
							disabled={readOnly}
						>
							{specLevels.map((level) => (
								<option key={level} value={level}>
									{level}
								</option>
							))}
						</select>
					</div>
					<div className="grid gap-1">
						<Label htmlFor="draft-kind">Change kind</Label>
						<select
							id="draft-kind"
							className="rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={changeKind}
							onChange={(e) => onChangeKindChange(e.target.value)}
							disabled={readOnly}
						>
							{changeKinds.map((kind) => (
								<option key={kind} value={kind}>
									{kind}
								</option>
							))}
						</select>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-1">
						<Label htmlFor="draft-parent">Parent slug</Label>
						<Input
							id="draft-parent"
							className="font-mono text-xs"
							value={parentSlug}
							onChange={(e) => onParentSlugChange(e.target.value)}
							disabled={readOnly}
						/>
					</div>
					<div className="grid gap-1">
						<Label htmlFor="draft-leaf">Leaf slug</Label>
						<Input
							id="draft-leaf"
							className="font-mono text-xs"
							value={leafSlug}
							onChange={(e) => onLeafSlugChange(e.target.value)}
							disabled={readOnly}
						/>
					</div>
				</div>
				<div className="grid gap-1">
					<Label>Layout</Label>
					{layoutEditor}
				</div>
				<div className="grid gap-1">
					<Label>Content</Label>
					{contentEditor}
				</div>
				{commentsPanel}
			</div>

			<div className="flex flex-wrap gap-2">
				{!readOnly && onSave ? (
					<Button type="button" disabled={busy} onClick={onSave}>
						{busy ? "Saving…" : "Save draft"}
					</Button>
				) : null}
				{showSubmit && onSubmit ? (
					<Button type="button" variant="outline" disabled={busy} onClick={onSubmit}>
						Submit for review
					</Button>
				) : null}
				{showDelete && onDelete ? (
					<Button type="button" variant="destructive" disabled={busy} onClick={onDelete}>
						Delete
					</Button>
				) : null}
			</div>
		</div>
	);
}
