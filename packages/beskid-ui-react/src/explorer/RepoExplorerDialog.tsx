"use client";

import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import {
	type ReactNode,
	useCallback,
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

function entryName(entry: RepoEntry): string {
	if (entry.name) {
		return entry.name;
	}
	const parts = entry.path.split("/").filter(Boolean);
	return parts[parts.length - 1] ?? (entry.path || "/");
}

function flattenRoots(entries: RepoEntry[] | undefined): RepoEntry[] {
	if (!entries || entries.length === 0) {
		return [];
	}
	if (
		entries.length === 1 &&
		entries[0]!.kind === "dir" &&
		(entries[0]!.path === "" || entries[0]!.path === "/") &&
		entries[0]!.children
	) {
		return entries[0]!.children;
	}
	return entries;
}

type TreeRowProps = {
	entry: RepoEntry;
	depth: number;
	selectedPath: string | null;
	expanded: Set<string>;
	childrenByPath: Map<string, RepoEntry[]>;
	loadingPaths: Set<string>;
	onToggle: (entry: RepoEntry) => void;
	onSelectRow: (entry: RepoEntry) => void;
};

function TreeRow({
	entry,
	depth,
	selectedPath,
	expanded,
	childrenByPath,
	loadingPaths,
	onToggle,
	onSelectRow,
}: TreeRowProps) {
	const isDir = entry.kind === "dir";
	const isExpanded = expanded.has(entry.path);
	const childEntries = entry.children ?? childrenByPath.get(entry.path) ?? [];
	const isLoading = loadingPaths.has(entry.path);
	const selected = selectedPath === entry.path;

	return (
		<li>
			<button
				type="button"
				className={cn(
					"flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted",
					selected && "bg-muted text-foreground",
				)}
				style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
				onClick={() => {
					onSelectRow(entry);
					if (isDir) {
						onToggle(entry);
					}
				}}
			>
				{isDir ? (
					<ChevronRightIcon
						className={cn(
							"size-3.5 shrink-0 text-muted-foreground transition-transform",
							isExpanded && "rotate-90",
						)}
					/>
				) : (
					<span className="inline-block size-3.5 shrink-0" />
				)}
				{isDir ? (
					<FolderIcon className="size-4 shrink-0 text-muted-foreground" />
				) : (
					<FileIcon className="size-4 shrink-0 text-muted-foreground" />
				)}
				<span className="truncate">{entryName(entry)}</span>
				{isLoading ? (
					<span className="ml-auto text-xs text-muted-foreground">…</span>
				) : null}
			</button>
			{isDir && isExpanded ? (
				<ul className="m-0 list-none p-0">
					{childEntries.map((child) => (
						<TreeRow
							key={child.path}
							entry={child}
							depth={depth + 1}
							selectedPath={selectedPath}
							expanded={expanded}
							childrenByPath={childrenByPath}
							loadingPaths={loadingPaths}
							onToggle={onToggle}
							onSelectRow={onSelectRow}
						/>
					))}
				</ul>
			) : null}
		</li>
	);
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
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
	const [childrenByPath, setChildrenByPath] = useState<Map<string, RepoEntry[]>>(
		() => new Map(),
	);
	const [loadingPaths, setLoadingPaths] = useState<Set<string>>(() => new Set());
	const [rootRemote, setRootRemote] = useState<RepoEntry[]>([]);
	const [rootError, setRootError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}
		setSelected(null);
		setExpanded(new Set());
		setChildrenByPath(new Map());
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

	const onToggle = useCallback(
		async (entry: RepoEntry) => {
			if (entry.kind !== "dir") {
				return;
			}
			const next = new Set(expanded);
			if (next.has(entry.path)) {
				next.delete(entry.path);
				setExpanded(next);
				return;
			}
			next.add(entry.path);
			setExpanded(next);

			if (
				entry.children?.length ||
				childrenByPath.has(entry.path) ||
				!listChildren
			) {
				return;
			}

			setLoadingPaths((prev) => new Set(prev).add(entry.path));
			try {
				const kids = await listChildren(entry.path);
				setChildrenByPath((prev) => {
					const map = new Map(prev);
					map.set(entry.path, kids);
					return map;
				});
			} catch (error) {
				setRootError(
					error instanceof Error ? error.message : "Failed to load directory",
				);
			} finally {
				setLoadingPaths((prev) => {
					const nextLoading = new Set(prev);
					nextLoading.delete(entry.path);
					return nextLoading;
				});
			}
		},
		[expanded, childrenByPath, listChildren],
	);

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
						<ul className="m-0 list-none p-0">
							{displayRoots.map((entry) => (
								<TreeRow
									key={entry.path || entryName(entry)}
									entry={entry}
									depth={0}
									selectedPath={selected?.path ?? null}
									expanded={expanded}
									childrenByPath={childrenByPath}
									loadingPaths={loadingPaths}
									onToggle={onToggle}
									onSelectRow={setSelected}
								/>
							))}
						</ul>
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
