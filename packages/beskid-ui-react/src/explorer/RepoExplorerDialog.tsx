"use client";

import {
	type ReactNode,
	useEffect,
	useMemo,
	useState,
} from "react";
import { Button } from "../components/ui/button.js";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../components/ui/dialog.js";
import { ScrollArea } from "../components/ui/scroll-area.js";
import { cn } from "../lib/utils.js";
import { FileExplorer } from "./FileExplorer.js";
import type { ListChildrenFn, RepoEntry } from "./types.js";

export type RepoExplorerDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: string;
	/** Pre-built tree (local / fixture mode). */
	entries?: RepoEntry[];
	/**
	 * Lazy children loader. Used when expanding dirs without embedded children,
	 * and for remote browser mode.
	 */
	listChildren?: ListChildrenFn;
	/** Called when the user confirms a file (or optionally a dir). */
	onSelect?: (entry: RepoEntry) => void;
	/** Allow selecting directories (default: files only). */
	allowDirectorySelect?: boolean;
	confirmLabel?: string;
	cancelLabel?: string;
	className?: string;
	emptyMessage?: string;
	footer?: ReactNode;
};

function flattenRoots(entries: RepoEntry[] | undefined): RepoEntry[] {
	if (!entries || entries.length === 0) {
		return [];
	}
	if (
		entries.length === 1 &&
		entries[0]?.kind === "dir" &&
		(entries[0]?.path === "" || entries[0]?.path === "/") &&
		entries[0]?.children
	) {
		return entries[0]?.children;
	}
	return entries;
}

/**
 * Repo path picker dialog.
 *
 * Dual mode:
 * 1. Local — pass `entries` (optionally nested) and/or `listChildren(path)`.
 * 2. Remote — pass async `listChildren` only; dialog owns UI, caller owns data.
 */
export function RepoExplorerDialog({
	open,
	onOpenChange,
	title = "Browse repository",
	description = "Select a path to attach or open.",
	entries,
	listChildren,
	onSelect,
	allowDirectorySelect = false,
	confirmLabel = "Select",
	cancelLabel = "Cancel",
	className,
	emptyMessage = "No entries to show.",
	footer,
}: RepoExplorerDialogProps) {
	const roots = useMemo(() => flattenRoots(entries), [entries]);
	const [selected, setSelected] = useState<RepoEntry | null>(null);
	const [rootRemote, setRootRemote] = useState<RepoEntry[]>([]);
	const [rootError, setRootError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}
		setSelected(null);
		setRootError(null);

		if (roots.length > 0 || !listChildren) {
			setRootRemote([]);
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const listing = await listChildren("");
				if (!cancelled) {
					setRootRemote(listing);
				}
			} catch (error) {
				if (!cancelled) {
					setRootError(
						error instanceof Error ? error.message : "Failed to load repository",
					);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [open, roots.length, listChildren]);

	const displayRoots = roots.length > 0 ? roots : rootRemote;

	const canConfirm =
		selected != null && (selected.kind === "file" || allowDirectorySelect);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton
				className={cn(
					"flex max-h-[min(calc(100svh-2rem),36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
					className,
				)}
			>
				<DialogHeader className="border-b border-border px-6 py-5">
					<DialogTitle>{title}</DialogTitle>
					{description ? <DialogDescription>{description}</DialogDescription> : null}
				</DialogHeader>

				<ScrollArea className="min-h-0 flex-1 px-3 py-3">
					{rootError ? (
						<p className="px-3 py-2 text-sm text-destructive">{rootError}</p>
					) : displayRoots.length === 0 ? (
						<p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
					) : (
						<FileExplorer
							entries={displayRoots}
							onSelect={setSelected}
							activePath={selected?.path}
							allowDirectorySelect={allowDirectorySelect}
							ariaLabel={title}
							listChildren={listChildren}
						/>
					)}
				</ScrollArea>

				{footer ?? (
					<DialogFooter className="border-t border-border px-6 py-4">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{cancelLabel}
						</Button>
						<Button
							disabled={!canConfirm}
							onClick={() => {
								if (selected && canConfirm) {
									onSelect?.(selected);
									onOpenChange(false);
								}
							}}
						>
							{confirmLabel}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
