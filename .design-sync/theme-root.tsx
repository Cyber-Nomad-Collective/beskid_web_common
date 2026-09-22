// design-sync only: Beskid apps set <html data-theme="light|dark"> themselves
// (shadcn-theme.css scopes every semantic token to html[data-theme]). Preview
// cards and Claude Design renders have no app shell, so this module defaults
// the attribute to the brand scheme (dark) at load and paints the page with the
// theme surface. Not part of the published package API.
import { type ReactNode, useLayoutEffect } from "react";

export type BeskidThemeRootProps = {
	/** Beskid Material scheme; dark is the brand default. */
	theme?: "dark" | "light";
	children?: ReactNode;
};

if (typeof document !== "undefined") {
	const root = document.documentElement;
	if (!root.dataset.theme) root.dataset.theme = "dark";
	const style = document.createElement("style");
	style.dataset.beskidThemeRoot = "";
	// html[data-theme] body outranks host page `body { background }` resets;
	// the design-sync floor card keeps its own light chrome so it stays legible.
	style.textContent =
		"html[data-theme] body{background:var(--background);color:var(--foreground);color-scheme:" +
		"dark}html[data-theme='light'] body{color-scheme:light}" +
		"[data-ds-fallback]{background:#fff}";
	document.head.appendChild(style);
}

export function BeskidThemeRoot({ theme = "dark", children }: BeskidThemeRootProps) {
	useLayoutEffect(() => {
		document.documentElement.dataset.theme = theme;
	}, [theme]);
	return <>{children}</>;
}
