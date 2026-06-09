"use client";

import { useState } from "react";

export interface SpecCommentItem {
	id: string;
	author: string;
	body: string;
	createdAt: string;
	resolved?: boolean;
}

export interface SpecCommentsPanelProps {
	comments: SpecCommentItem[];
	onChange: (comments: SpecCommentItem[]) => void;
	disabled?: boolean;
}

export function SpecCommentsPanel({
	comments,
	onChange,
	disabled = false,
}: SpecCommentsPanelProps) {
	const [draft, setDraft] = useState("");

	function addComment() {
		const body = draft.trim();
		if (!body) return;
		onChange([
			...comments,
			{
				id: crypto.randomUUID(),
				author: "local",
				body,
				createdAt: new Date().toISOString(),
				resolved: false,
			},
		]);
		setDraft("");
	}

	return (
		<section className="space-y-3 rounded-md border p-4">
			<h3 className="text-sm font-semibold">Comments</h3>
			<ul className="space-y-2">
				{comments.length === 0 ? (
					<li className="text-sm text-muted-foreground">No comments yet.</li>
				) : (
					comments.map((comment) => (
						<li key={comment.id} className="rounded-md border p-2 text-sm">
							<div className="mb-1 flex items-center justify-between gap-2">
								<span className="font-medium">{comment.author}</span>
								<time className="text-xs text-muted-foreground">
									{comment.createdAt}
								</time>
							</div>
							<p>{comment.body}</p>
						</li>
					))
				)}
			</ul>
			{!disabled ? (
				<div className="space-y-2">
					<textarea
						className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						placeholder="Add a review comment…"
					/>
					<button
						type="button"
						className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
						onClick={addComment}
					>
						Add comment
					</button>
				</div>
			) : null}
		</section>
	);
}
