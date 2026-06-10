"use client";

import type { ReactNode } from "react";

import { Button } from "../components/ui/button.js";
import { cn } from "../lib/utils.js";

export interface DraftListItem {
	id: string;
	title: string;
	slug: string;
	status: string;
	updatedAt: string;
}

export interface DraftListPanelProps {
	drafts: DraftListItem[];
	renderDraftLink: (draft: DraftListItem) => ReactNode;
	onCreate?: () => void;
	createLabel?: string;
	emptyMessage?: string;
	className?: string;
}

function statusLabel(status: string): string {
	return status.replace(/_/g, " ");
}

export function DraftListPanel({
	drafts,
	renderDraftLink,
	onCreate,
	createLabel = "New draft",
	emptyMessage = "No drafts yet. Create one to propose platform-spec changes.",
	className,
}: DraftListPanelProps) {
	return (
		<div className={cn("mx-auto max-w-4xl space-y-6", className)}>
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">My drafts</h1>
				{onCreate ? (
					<Button type="button" onClick={onCreate}>
						{createLabel}
					</Button>
				) : null}
			</div>

			{drafts.length === 0 ? (
				<p className="text-sm text-muted-foreground">{emptyMessage}</p>
			) : (
				<ul className="divide-y rounded-lg border">
					{drafts.map((draft) => (
						<li
							key={draft.id}
							className="flex items-center justify-between px-4 py-3"
						>
							<div>{renderDraftLink(draft)}</div>
							<span className="text-xs text-muted-foreground">
								{new Date(draft.updatedAt).toLocaleString()}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export { statusLabel as draftStatusLabel };
