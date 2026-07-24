import type { OpenInEditorScheme, OpenInEditorTarget } from "./types.js";

export type OpenInEditorOptions = {
	preferLocal?: boolean;
	isLocal?: boolean;
	localScheme?: "cursor" | "vscode";
	githubRepo?: string;
	githubRef?: string;
	githubBlobBase?: string;
};

function isLocalHost(hostname: string): boolean {
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "[::1]" ||
		hostname === "0.0.0.0"
	);
}

function resolveIsLocal(options?: OpenInEditorOptions): boolean {
	if (typeof options?.isLocal === "boolean") return options.isLocal;
	if (typeof options?.preferLocal === "boolean") return options.preferLocal;
	if (typeof window === "undefined") return false;
	return isLocalHost(window.location.hostname);
}

function githubBlobUrl(
	target: OpenInEditorTarget,
	options?: OpenInEditorOptions,
): string {
	if (options?.githubBlobBase) {
		const base = options.githubBlobBase.replace(/\/+$/, "");
		const rel = target.path.replace(/^\.?\//, "");
		const line = target.line != null ? `#L${target.line}` : "";
		return `${base}/${rel}${line}`;
	}
	const repo = target.githubRepo ?? options?.githubRepo;
	if (!repo) {
		throw new Error(
			"openInEditorUrl: githubRepo or githubBlobBase is required for GitHub blob URLs",
		);
	}
	const ref = target.githubRef ?? options?.githubRef ?? "main";
	const cleanPath = target.path.replace(/^\/+/, "");
	const line = target.line != null ? `#L${target.line}` : "";
	return `https://github.com/${repo}/blob/${ref}/${cleanPath}${line}`;
}

function localEditorUrl(
	target: OpenInEditorTarget,
	scheme: "cursor" | "vscode",
): string {
	const line = target.line ?? 1;
	const column = target.column ?? 1;
	const filePath = target.path.startsWith("/") ? target.path : `/${target.path}`;
	return `${scheme}://file${filePath}:${line}:${column}`;
}

/**
 * Build an open-in-editor URL.
 * Local apps prefer cursor:// / vscode://; public docs fall back to GitHub blob.
 */
export function openInEditorUrl(
	target: OpenInEditorTarget,
	options?: OpenInEditorOptions,
): string {
	const scheme: OpenInEditorScheme | undefined = target.scheme;
	if (scheme === "github") return githubBlobUrl(target, options);
	if (scheme === "cursor" || scheme === "vscode") {
		return localEditorUrl(target, scheme);
	}
	if (resolveIsLocal(options)) {
		return localEditorUrl(target, options?.localScheme ?? "cursor");
	}
	return githubBlobUrl(target, options);
}
