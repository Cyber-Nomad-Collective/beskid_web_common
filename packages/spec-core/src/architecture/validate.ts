import fs from "node:fs";
import path from "node:path";
import { SPEC_ARCHITECTURE_DIR, SPEC_WORKSPACE_MANIFEST } from "../constants.js";
import type { ArchitectureComponentKind } from "./kinds.js";
import { parseArchitectureComponent } from "./components.js";
import { isRelationAllowed, parseArchitectureRelation } from "./relations.js";
import {
	isArchitectureGraphV2,
	parseArchitectureGraphV2,
	type ArchitectureGraphV2,
} from "./schema.js";
import { normalizeArchitectureGraph } from "./migrate.js";
import { parseWorkspaceManifest } from "../workspace/schema.js";

export interface ArchitectureValidationIssue {
	code: string;
	message: string;
	path?: string;
}

export interface ArchitectureValidationResult {
	ok: boolean;
	issues: ArchitectureValidationIssue[];
	graph?: ArchitectureGraphV2;
}

export function validateArchitectureGraph(
	raw: unknown,
	options: {
		knownSpecSlugs?: Set<string>;
		context?: string;
	} = {},
): ArchitectureValidationResult {
	const issues: ArchitectureValidationIssue[] = [];
	const context = options.context ?? "graph";

	let graph: ArchitectureGraphV2;
	try {
		graph = isArchitectureGraphV2(raw)
			? parseArchitectureGraphV2(raw, context)
			: normalizeArchitectureGraph(raw);
	} catch (err) {
		return {
			ok: false,
			issues: [
				{
					code: "E_ARCH_PARSE",
					message: err instanceof Error ? err.message : String(err),
				},
			],
		};
	}

	const nodeById = new Map<string, ArchitectureComponentKind>();
	for (const node of graph.nodes) {
		if (nodeById.has(node.id)) {
			issues.push({
				code: "E_ARCH_DUP_NODE",
				message: `Duplicate node id "${node.id}"`,
				path: `nodes.${node.id}`,
			});
			continue;
		}
		try {
			parseArchitectureComponent(node, `nodes.${node.id}`);
		} catch (err) {
			issues.push({
				code: "E_ARCH_INVALID_NODE",
				message: err instanceof Error ? err.message : String(err),
				path: `nodes.${node.id}`,
			});
			continue;
		}
		nodeById.set(node.id, node.kind);

		if (node.kind === "specNode" && options.knownSpecSlugs) {
			if (!options.knownSpecSlugs.has(node.props.slug)) {
				issues.push({
					code: "E_ARCH_UNKNOWN_SPEC_SLUG",
					message: `Unknown spec slug "${node.props.slug}"`,
					path: `nodes.${node.id}.props.slug`,
				});
			}
		}

		for (const [i, link] of (node.links ?? []).entries()) {
			if (
				link.kind === "specNode" &&
				options.knownSpecSlugs &&
				!options.knownSpecSlugs.has(link.slug)
			) {
				issues.push({
					code: "E_ARCH_UNKNOWN_SPEC_SLUG",
					message: `Unknown spec slug in link "${link.slug}"`,
					path: `nodes.${node.id}.links[${i}]`,
				});
			}
		}
	}

	for (const [i, edge] of graph.edges.entries()) {
		try {
			parseArchitectureRelation(edge, `edges[${i}]`);
		} catch (err) {
			issues.push({
				code: "E_ARCH_INVALID_EDGE",
				message: err instanceof Error ? err.message : String(err),
				path: `edges[${i}]`,
			});
			continue;
		}

		const fromKind = nodeById.get(edge.from);
		const toKind = nodeById.get(edge.to);
		if (!fromKind || !toKind) {
			if (!fromKind) {
				issues.push({
					code: "E_ARCH_UNKNOWN_ENDPOINT",
					message: `Edge from unknown node "${edge.from}"`,
					path: `edges[${i}].from`,
				});
			}
			if (!toKind) {
				issues.push({
					code: "E_ARCH_UNKNOWN_ENDPOINT",
					message: `Edge to unknown node "${edge.to}"`,
					path: `edges[${i}].to`,
				});
			}
			continue;
		}

		if (!isRelationAllowed(edge.kind, fromKind, toKind)) {
			issues.push({
				code: "E_ARCH_REL_INCOMPATIBLE",
				message: `Relation "${edge.kind}" is not allowed from ${fromKind} to ${toKind}`,
				path: `edges[${i}]`,
			});
		}
	}

	const errors = issues.filter((i) => i.code.startsWith("E_ARCH_"));
	return {
		ok: errors.length === 0,
		issues,
		graph,
	};
}

export function readArchitectureGraphFile(
	filePath: string,
	options?: { knownSpecSlugs?: Set<string> },
): ArchitectureValidationResult {
	if (!fs.existsSync(filePath)) {
		return {
			ok: false,
			issues: [
				{
					code: "E_ARCH_MISSING",
					message: `Missing architecture graph file: ${filePath}`,
				},
			],
		};
	}
	const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
	return validateArchitectureGraph(raw, {
		...options,
		context: filePath,
	});
}

export function listArchitectureGraphKeys(workspaceDir: string): string[] {
	const dir = path.join(workspaceDir, SPEC_ARCHITECTURE_DIR);
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith(".json"))
		.map((f) => f.replace(/\.json$/, ""));
}

export function validateArchitectureGraphsInWorkspace(
	workspaceDir: string,
	knownSpecSlugs?: Set<string>,
): ArchitectureValidationIssue[] {
	const issues: ArchitectureValidationIssue[] = [];
	const manifestPath = path.join(workspaceDir, SPEC_WORKSPACE_MANIFEST);
	if (!fs.existsSync(manifestPath)) return issues;

	let manifest;
	try {
		manifest = parseWorkspaceManifest(
			JSON.parse(fs.readFileSync(manifestPath, "utf8")),
			manifestPath,
		);
	} catch {
		return issues;
	}

	const onDisk = new Set(
		listArchitectureGraphKeys(workspaceDir).map((k) => k.toLowerCase()),
	);
	for (const key of manifest.architectureGraphs ?? []) {
		const lower = key.toLowerCase();
		if (!onDisk.has(lower)) {
			issues.push({
				code: "E_ARCH_REGISTRY_MISSING",
				message: `Registered graph "${key}" has no file at ${SPEC_ARCHITECTURE_DIR}/${key}.json`,
			});
		}
	}

	for (const key of onDisk) {
		const filePath = path.join(
			workspaceDir,
			SPEC_ARCHITECTURE_DIR,
			`${key}.json`,
		);
		const result = readArchitectureGraphFile(filePath, { knownSpecSlugs });
		for (const issue of result.issues) {
			issues.push({
				...issue,
				path: `${SPEC_ARCHITECTURE_DIR}/${key}.json${issue.path ? `:${issue.path}` : ""}`,
			});
		}
	}

	return issues;
}
