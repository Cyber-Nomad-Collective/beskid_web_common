"use client";

import { Button } from "../components/ui/button.js";
import { cn } from "../lib/utils.js";

export interface ModerationDraftItem {
	id: string;
	title: string;
	summary?: string | null;
	slug: string;
	changeKind: string;
	authorLogin: string;
}

export interface ModerationQueuePanelProps {
	drafts: ModerationDraftItem[];
	busyId?: string | null;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
	emptyMessage?: string;
	className?: string;
}

export function ModerationQueuePanel({
	drafts,
	busyId = null,
	onApprove,
	onReject,
	emptyMessage = "No drafts awaiting review.",
	className,
}: ModerationQueuePanelProps) {
	if (drafts.length === 0) {
		return <p className={cn("text-sm text-muted-foreground", className)}>{emptyMessage}</p>;
	}

	return (
		<ul className={cn("divide-y rounded-lg border", className)}>
			{drafts.map((draft) => (
				<li key={draft.id} className="space-y-3 px-4 py-4">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="font-medium">{draft.title}</h2>
							<p className="text-xs text-muted-foreground">
								@{draft.authorLogin} · {draft.slug} · {draft.changeKind}
							</p>
							{draft.summary ? (
								<p className="mt-2 text-sm">{draft.summary}</p>
							) : null}
						</div>
						<div className="flex shrink-0 gap-2">
							<Button
								type="button"
								size="sm"
								disabled={busyId === draft.id}
								onClick={() => onApprove(draft.id)}
							>
								Approve & open PR
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={busyId === draft.id}
								onClick={() => onReject(draft.id)}
							>
								Reject
							</Button>
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
