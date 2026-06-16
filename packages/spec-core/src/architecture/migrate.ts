import type { ArchitectureComponentKind } from "./kinds.js";
import { COMPILER_PIPELINE_PHASES } from "./kinds.js";
import type { ArchitectureComponent } from "./components.js";
import type { ArchitectureRelation } from "./relations.js";
import type { ArchitectureLink } from "./links.js";
import {
	type ArchitectureGraphV1,
	type ArchitectureGraphV2,
	isArchitectureGraphV2,
	parseArchitectureGraphV1,
} from "./schema.js";

const SERVICE_TAG_HINTS = [
	"tracker",
	"platform-spec",
	"pckg",
	"nexus",
	"auth",
	"website",
];

const PIPELINE_PHASE_BY_ID: Record<string, (typeof COMPILER_PIPELINE_PHASES)[number]> =
	{
		resolve: "resolve",
		parse: "parse",
		lower: "lower",
		jit: "jit",
		aot: "aot",
		lsp: "lsp",
		semantic: "lower",
		lowering: "codegen",
		codegen: "codegen",
	};

function inferPipelinePhase(
	id: string,
	label: string,
	tags: string[] = [],
): (typeof COMPILER_PIPELINE_PHASES)[number] {
	const key = id.toLowerCase();
	if (PIPELINE_PHASE_BY_ID[key]) return PIPELINE_PHASE_BY_ID[key];
	const labelLower = label.toLowerCase();
	if (labelLower.includes("parse")) return "parse";
	if (labelLower.includes("lower") || labelLower.includes("semantic"))
		return "lower";
	if (labelLower.includes("jit")) return "jit";
	if (labelLower.includes("aot") || labelLower.includes("build")) return "aot";
	if (labelLower.includes("lsp")) return "lsp";
	if (tags.some((t) => t.includes("resolve"))) return "resolve";
	return "lower";
}

function linksFromHref(href?: string): ArchitectureLink[] | undefined {
	if (!href) return undefined;
	if (href.includes("/platform-spec/")) {
		const slug = href.replace(/^\//, "").replace(/\/$/, "");
		const normalized = slug.startsWith("platform-spec")
			? slug
			: `platform-spec/${slug}`;
		return [{ kind: "specNode", slug: normalized }];
	}
	return undefined;
}

function inferComponentKind(
	node: ArchitectureGraphV1["nodes"][number],
	isPipelineGraph: boolean,
): ArchitectureComponentKind {
	const meta = node.meta ?? {};
	const tags = (node.tags ?? []).map((t) => t.toLowerCase());
	const c4Kind = meta.kind?.toLowerCase();

	if (c4Kind === "container" || c4Kind === "system") {
		return "service";
	}
	if (c4Kind === "component") {
		return "rustModule";
	}

	if (meta.Crate || tags.some((t) => t.startsWith("beskid_"))) {
		if (isPipelineGraph) return "compilerPipelineStage";
		return "rustModule";
	}

	if (tags.some((t) => SERVICE_TAG_HINTS.includes(t))) {
		return "service";
	}

	if (node.href?.includes("/platform-spec/")) {
		return "specNode";
	}

	if (tags.includes("manifest") || tags.includes("mod")) {
		return "beskidProject";
	}

	return "rustModule";
}

function migrateNode(
	node: ArchitectureGraphV1["nodes"][number],
	isPipelineGraph: boolean,
): ArchitectureComponent {
	const kind = inferComponentKind(node, isPipelineGraph);
	const links = linksFromHref(node.href);
	const base = {
		id: node.id,
		label: node.label,
		group: node.group,
		description: node.description,
		href: node.href,
		hidden: node.hidden,
		links,
	};

	const meta = node.meta ?? {};
	const tags = node.tags ?? [];

	switch (kind) {
		case "service":
			return {
				...base,
				kind: "service",
				props: {
					name: node.id,
					host: meta.technology ?? tags[0] ?? node.label,
					stack: meta.technology,
				},
			};
		case "compilerPipelineStage":
			return {
				...base,
				kind: "compilerPipelineStage",
				props: {
					crate: meta.Crate ?? "beskid_analysis",
					entry: meta.Entry ?? node.id,
					phase: inferPipelinePhase(node.id, node.label, tags),
				},
			};
		case "specNode": {
			const slug =
				links?.[0]?.kind === "specNode"
					? links[0].slug
					: `platform-spec/${node.id}`;
			return {
				...base,
				kind: "specNode",
				props: { slug },
			};
		}
		case "beskidProject":
			return {
				...base,
				kind: "beskidProject",
				props: {
					manifestPath: meta.manifest ?? `${node.id}.bproj`,
				},
			};
		case "dependency":
			return {
				...base,
				kind: "dependency",
				props: {
					crate: meta.Crate ?? node.id,
					purpose: node.description ?? node.label,
					source: "workspace",
				},
			};
		default:
			return {
				...base,
				kind: "rustModule",
				props: {
					crate: meta.Crate ?? tags.find((t) => t.startsWith("beskid_")) ?? "unknown",
					modulePath: meta.Entry ?? node.id,
				},
			};
	}
}

function inferRelationKind(
	edge: ArchitectureGraphV1["edges"][number],
	isPipelineGraph: boolean,
): ArchitectureRelation["kind"] {
	const label = (edge.label ?? "").toLowerCase();
	if (label.includes("implement")) return "implements";
	if (label.includes("depend")) return "dependsOn";
	if (label.includes("vendor")) return "vendoredFrom";
	if (label.includes("lower")) return "lowersTo";
	if (label.includes("call") || label.includes("invok")) return "calls";
	if (label.includes("contain") || label.includes("discover")) return "contains";
	if (label.includes("feed") || label.includes("record")) return "feeds";
	if (isPipelineGraph) return "feeds";
	return "relatesTo";
}

function migrateEdge(
	edge: ArchitectureGraphV1["edges"][number],
	isPipelineGraph: boolean,
): ArchitectureRelation {
	const kind = inferRelationKind(edge, isPipelineGraph);
	return {
		id: edge.id,
		kind,
		from: edge.from,
		to: edge.to,
		label: edge.label,
		description: edge.description,
		hidden: edge.hidden,
		props: kind === "relatesTo" ? { inferred: true } : {},
	};
}

export function migrateArchitectureGraphV1ToV2(
	raw: unknown,
): ArchitectureGraphV2 {
	if (isArchitectureGraphV2(raw)) {
		return raw;
	}
	const v1 = parseArchitectureGraphV1(raw);
	const isPipelineGraph =
		(v1.title ?? "").toLowerCase().includes("pipeline") ||
		v1.nodes.some((n) => n.meta?.Crate?.startsWith("beskid_"));

	return {
		version: 2,
		title: v1.title,
		description: v1.description,
		groups: v1.groups,
		nodes: v1.nodes.map((n) => migrateNode(n, isPipelineGraph)),
		edges: v1.edges.map((e) => migrateEdge(e, isPipelineGraph)),
	};
}

export function normalizeArchitectureGraph(raw: unknown): ArchitectureGraphV2 {
	return migrateArchitectureGraphV1ToV2(raw);
}
