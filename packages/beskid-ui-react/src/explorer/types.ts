export type RepoEntryKind = "file" | "dir";

export type RepoEntry = {
	path: string;
	kind: RepoEntryKind;
	name?: string;
	children?: RepoEntry[];
};

export type OpenInEditorScheme = "vscode" | "cursor" | "github";

export type OpenInEditorTarget = {
	path: string;
	line?: number;
	column?: number;
	scheme?: OpenInEditorScheme;
	githubRepo?: string;
	githubRef?: string;
};

export type ListChildrenFn = (
	path: string,
) => Promise<RepoEntry[]> | RepoEntry[];

/** @deprecated Prefer ListChildrenFn */
export type ListRepoChildren = ListChildrenFn;

export type RemoteRepoLoader = {
	listChildren: ListChildrenFn;
	rootLabel?: string;
};
