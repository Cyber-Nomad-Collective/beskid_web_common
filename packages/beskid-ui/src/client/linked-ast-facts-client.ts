import { createElement } from "react";
import { createRoot } from "react-dom/client";

import {
	LinkedAstFactsView,
	sampleAst,
	sampleFacts,
	type AstGraphModel,
	type FactsDagModel,
} from "@cyber-nomad-collective/beskid-ui-react/graph";

type ShellPayload = {
	ast?: AstGraphModel;
	facts?: FactsDagModel;
	githubRepo?: string;
	githubRef?: string;
};

function parsePayload(root: HTMLElement): ShellPayload {
	const dataId = root.getAttribute("data-graph-data");
	if (!dataId) return {};
	const el = document.getElementById(dataId);
	if (!el?.textContent?.trim()) return {};
	try {
		return JSON.parse(el.textContent) as ShellPayload;
	} catch {
		return {};
	}
}

function mountLinkedAstFacts(root: HTMLElement) {
	if (root.dataset.mounted === "1") return;
	root.dataset.mounted = "1";
	const payload = parsePayload(root);
	const mount = root.querySelector<HTMLElement>("[data-linked-ast-facts-mount]");
	if (!mount) return;

	const githubRepo =
		payload.githubRepo ?? "Cyber-Nomad-Collective/beskid";
	const githubRef = payload.githubRef ?? "main";

	createRoot(mount).render(
		createElement(LinkedAstFactsView, {
			ast: payload.ast ?? sampleAst,
			facts: payload.facts ?? sampleFacts,
			openInEditor: {
				isLocal: false,
				githubRepo,
				githubRef,
			},
		}),
	);
}

function boot() {
	document
		.querySelectorAll<HTMLElement>("[data-linked-ast-facts-root]")
		.forEach(mountLinkedAstFacts);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot);
} else {
	boot();
}

document.addEventListener("astro:page-load", boot);
