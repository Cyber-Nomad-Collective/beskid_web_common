"use client";

import {
	ChevronRightIcon,
	FileCodeIcon,
	FileCogIcon,
	FileIcon,
	FileJsonIcon,
	FolderIcon,
	Loader2Icon,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "../lib/utils.js";
import type { FileEntry, RepoEntry } from "./types.js";

/** Re-export so consumers can import from the same module. */
export type { FileEntry, RepoEntry };

export type FileExplorerProps = {
	/** Root entries (already flattened — no single root dir wrapping). */
	entries: FileEntry[];
	/** Called when a file (or dir, if allowDirectorySelect) is clicked/activated. */
	onSelect?: (entry: FileEntry) => void;
	/** Path of the currently active (highlighted) entry. */
	activePath?: string;
	/** Additional class for the tree container. */
	className?: string;
	/** Allow selecting directory entries (default: files only). */
	allowDirectorySelect?: boolean;
	/** ARIA label for the tree widget. */
	ariaLabel?: string;
	/**
	 * Optional lazy loader for directory children.
	 * When provided, expanding a dir that has no embedded children calls this.
	 */
	listChildren?: (path: string) => Promise<RepoEntry[]> | RepoEntry[];
};

// ── helpers ────────────────────────────────────────────────────────────────

function entryDisplayName(entry: FileEntry): string {
	if (entry.name) return entry.name;
	const parts = entry.path.split("/").filter(Boolean);
	return parts[parts.length - 1] ?? (entry.path || "/");
}

function fileExtension(name: string): string {
	const dot = name.lastIndexOf(".");
	return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function normalizeEntryPath(path?: string): string {
	return path?.replace(/^\.\/+/, "").replace(/\/+$/, "") ?? "";
}

function FileTypeIcon({
	entry,
	className,
}: {
	entry: FileEntry;
	className: string;
}) {
	if (entry.kind === "dir") return <FolderIcon className={className} />;
	const ext = fileExtension(entryDisplayName(entry));
	switch (ext) {
		case "bs":
			return <FileCodeIcon className={className} />;
		case "bproj":
			return <FileCogIcon className={className} />;
		case "bws":
			return <FileJsonIcon className={className} />;
		default:
			return <FileIcon className={className} />;
	}
}

// ── flat list for keyboard nav ──────────────────────────────────────────────

type FlatItem = { entry: FileEntry; depth: number };

function flattenVisible(
	entries: FileEntry[],
	expanded: Set<string>,
	childrenByPath: Map<string, FileEntry[]>,
	depth = 0,
): FlatItem[] {
	const result: FlatItem[] = [];
	for (const entry of entries) {
		result.push({ entry, depth });
		if (entry.kind === "dir" && expanded.has(entry.path)) {
			const kids = entry.children ?? childrenByPath.get(entry.path) ?? [];
			result.push(...flattenVisible(kids, expanded, childrenByPath, depth + 1));
		}
	}
	return result;
}

// ── Icon span ───────────────────────────────────────────────────────────────

function IconSpan({
	entry,
	isExpanded,
	isLoading,
}: {
	entry: FileEntry;
	isExpanded: boolean;
	isLoading: boolean;
}) {
	if (entry.kind !== "dir") {
		return <span className="inline-block size-3.5 shrink-0" />;
	}
	if (isLoading) {
		return (
			<Loader2Icon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
		);
	}
	return (
		<ChevronRightIcon
			className={cn(
				"size-3.5 shrink-0 text-muted-foreground transition-transform",
				isExpanded && "rotate-90",
			)}
		/>
	);
}

// ── TreeItem (recursive) ────────────────────────────────────────────────────

type TreeItemProps = {
	entry: FileEntry;
	depth: number;
	expanded: Set<string>;
	childrenByPath: Map<string, FileEntry[]>;
	loadingPaths: Set<string>;
	activePath?: string;
	focusedPath: string | null;
	onClick: (entry: FileEntry) => void;
	onKeyDown: (
		e: ReactKeyboardEvent<HTMLButtonElement>,
		entry: FileEntry,
	) => void;
};

function TreeItem({
	entry,
	depth,
	expanded,
	childrenByPath,
	loadingPaths,
	activePath,
	focusedPath,
	onClick,
	onKeyDown,
}: TreeItemProps) {
	const isDir = entry.kind === "dir";
	const isExpanded = expanded.has(entry.path);
	const childEntries =
		entry.children ?? childrenByPath.get(entry.path) ?? [];
	const isLoading = loadingPaths.has(entry.path);
	const isFocused = focusedPath === entry.path;
	const isSelected =
		normalizeEntryPath(activePath) !== "" &&
		normalizeEntryPath(entry.path) === normalizeEntryPath(activePath);

	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (isFocused && buttonRef.current) {
			buttonRef.current.focus();
		}
	}, [isFocused]);

	return (
		<li
			role="treeitem"
			aria-expanded={isDir ? isExpanded : undefined}
			aria-selected={isSelected}
			onClick={() => onClick(entry)}
		>
			<button
				ref={buttonRef}
				type="button"
				tabIndex={isFocused ? 0 : -1}
				className={cn(
					"flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
					"hover:bg-accent hover:text-accent-foreground",
					isSelected && "bg-primary/10 text-primary",
				)}
				style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
				onClick={() => onClick(entry)}
				onKeyDown={(e) => onKeyDown(e, entry)}
			>
				<IconSpan
					entry={entry}
					isExpanded={isExpanded}
					isLoading={isLoading}
				/>
				<FileTypeIcon
					entry={entry}
					className="size-4 shrink-0 text-muted-foreground"
				/>
				<span className="truncate">{entryDisplayName(entry)}</span>
			</button>
			{isDir && isExpanded && childEntries.length > 0 ? (
				<ul role="group" className="m-0 list-none p-0">
					{childEntries.map((child) => (
						<TreeItem
							key={child.path || entryDisplayName(child)}
							entry={child}
							depth={depth + 1}
							expanded={expanded}
							childrenByPath={childrenByPath}
							loadingPaths={loadingPaths}
							activePath={activePath}
							focusedPath={focusedPath}
							onClick={onClick}
							onKeyDown={onKeyDown}
						/>
					))}
				</ul>
			) : null}
		</li>
	);
}

// ── FileExplorer ────────────────────────────────────────────────────────────

/**
 * Accessible, keyboard-navigable file/directory tree.
 *
 * Features:
 * - Expand/collapse directories (chevron)
 * - File-type icons (`.bs`, `.bproj`, `.bws`, generic)
 * - Active-path highlighting via `activePath`
 * - Full keyboard navigation (arrow keys, Enter, Home, End)
 * - ARIA tree role with treeitem children in a properly nested DOM
 * - Optional lazy loading via `listChildren`
 */
export function FileExplorer({
	entries,
	onSelect,
	activePath,
	className,
	allowDirectorySelect = false,
	ariaLabel = "File explorer",
	listChildren,
}: FileExplorerProps) {
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
	const [childrenByPath, setChildrenByPath] = useState<
		Map<string, FileEntry[]>
	>(() => new Map());
	const [loadingPaths, setLoadingPaths] = useState<Set<string>>(
		() => new Set(),
	);
	const [focusedPath, setFocusedPath] = useState<string | null>(null);

	const treeRef = useRef<HTMLUListElement>(null);

	// Flat list for keyboard navigation
	const flatItems = useMemo<FlatItem[]>(
		() => flattenVisible(entries, expanded, childrenByPath),
		[entries, expanded, childrenByPath],
	);

	// Auto-focus first item on mount
	useEffect(() => {
		if (!focusedPath && flatItems.length > 0) {
			setFocusedPath(flatItems[0]!.entry.path);
		}
	}, [flatItems, focusedPath]);

	const expandDir = useCallback(
		async (entry: FileEntry) => {
			if (entry.kind !== "dir") return;

			const next = new Set(expanded);

			if (next.has(entry.path)) {
				next.delete(entry.path);
				setExpanded(next);
				return;
			}

			next.add(entry.path);
			setExpanded(next);

			// Lazy-load children if needed
			const hasEmbedded =
				entry.children && entry.children.length > 0;
			if (hasEmbedded || childrenByPath.has(entry.path) || !listChildren) {
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

	const handleSelect = useCallback(
		(entry: FileEntry) => {
			if (entry.kind === "file" || allowDirectorySelect) {
				onSelect?.(entry);
			}
		},
		[onSelect, allowDirectorySelect],
	);

	const handleClick = useCallback(
		(entry: FileEntry) => {
			setFocusedPath(entry.path);
			if (entry.kind === "dir") expandDir(entry);
			handleSelect(entry);
		},
		[expandDir, handleSelect],
	);

	// ── keyboard navigation ────────────────────────────────────────────

	const handleKeyDown = useCallback(
		(e: ReactKeyboardEvent<HTMLButtonElement>, entry: FileEntry) => {
			const idx = flatItems.findIndex((i) => i.entry.path === entry.path);
			if (idx === -1) return;

			switch (e.key) {
				case "ArrowDown": {
					e.preventDefault();
					const nextIdx = Math.min(idx + 1, flatItems.length - 1);
					setFocusedPath(flatItems[nextIdx]!.entry.path);
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					const prevIdx = Math.max(idx - 1, 0);
					setFocusedPath(flatItems[prevIdx]!.entry.path);
					break;
				}
				case "ArrowRight": {
					e.preventDefault();
					if (entry.kind === "dir") {
						if (!expanded.has(entry.path)) {
							expandDir(entry);
						} else if (idx + 1 < flatItems.length) {
							setFocusedPath(flatItems[idx + 1]!.entry.path);
						}
					}
					break;
				}
				case "ArrowLeft": {
					e.preventDefault();
					if (entry.kind === "dir" && expanded.has(entry.path)) {
						setExpanded((prev) => {
							const next = new Set(prev);
							next.delete(entry.path);
							return next;
						});
					} else {
						// Move to parent
						const current = flatItems[idx]!;
						for (let i = idx - 1; i >= 0; i--) {
							if (flatItems[i]!.depth < current.depth) {
								setFocusedPath(flatItems[i]!.entry.path);
								break;
							}
						}
					}
					break;
				}
				case "Enter":
				case " ": {
					e.preventDefault();
					handleSelect(entry);
					if (entry.kind === "dir") expandDir(entry);
					break;
				}
				case "Home": {
					e.preventDefault();
					if (flatItems.length > 0) {
						setFocusedPath(flatItems[0]!.entry.path);
					}
					break;
				}
				case "End": {
					e.preventDefault();
					if (flatItems.length > 0) {
						setFocusedPath(flatItems[flatItems.length - 1]!.entry.path);
					}
					break;
				}
			}
		},
		[flatItems, expanded, expandDir, handleSelect],
	);

	if (entries.length === 0) {
		return (
			<div
				className={cn("px-3 py-2 text-sm text-muted-foreground", className)}
				role="tree"
				aria-label={ariaLabel}
			>
				No entries to show.
			</div>
		);
	}

	return (
		<ul
			ref={treeRef}
			role="tree"
			aria-label={ariaLabel}
			className={cn("m-0 list-none p-0 outline-none", className)}
		>
			{entries.map((entry) => (
				<TreeItem
					key={entry.path || entryDisplayName(entry)}
					entry={entry}
					depth={0}
					expanded={expanded}
					childrenByPath={childrenByPath}
					loadingPaths={loadingPaths}
					activePath={activePath}
					focusedPath={focusedPath}
					onClick={handleClick}
					onKeyDown={handleKeyDown}
				/>
			))}
		</ul>
	);
}
