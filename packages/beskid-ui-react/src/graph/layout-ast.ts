import { hierarchy, tree } from "d3-hierarchy";
import type { Edge, Node } from "@xyflow/react";

import type { AstGraphModel, AstGraphNode } from "./types.js";

export type AstFlowNodeData = {
	label: string;
	kind: string;
	factIds: string[];
	spanPath?: string;
	selected: boolean;
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 44;

type HierarchyDatum = {
	id: string;
	node: AstGraphNode;
	children?: HierarchyDatum[];
};

function buildHierarchy(model: AstGraphModel): HierarchyDatum | null {
	const byId = new Map(model.nodes.map((n) => [n.id, n]));
	const visited = new Set<string>();

	const walk = (id: string): HierarchyDatum | null => {
		const node = byId.get(id);
		if (!node || visited.has(id)) return null;
		visited.add(id);
		const children = (node.children ?? [])
			.map(walk)
			.filter((c): c is HierarchyDatum => c != null);
		return { id, node, children: children.length ? children : undefined };
	};

	if (model.roots.length === 1) {
		return walk(model.roots[0]!);
	}

	const children = model.roots
		.map(walk)
		.filter((c): c is HierarchyDatum => c != null);
	if (!children.length) return null;
	return {
		id: "__forest_root__",
		node: { id: "__forest_root__", kind: "Forest", label: "roots" },
		children,
	};
}

/**
 * Layout an AST forest with d3-hierarchy `tree`, producing ReactFlow nodes/edges.
 */
export function layoutAstTree(
	model: AstGraphModel,
	options?: { selectedNodeId?: string | null },
): { nodes: Node<AstFlowNodeData>[]; edges: Edge[] } {
	const rootDatum = buildHierarchy(model);
	if (!rootDatum) return { nodes: [], edges: [] };

	const root = hierarchy(rootDatum);
	const layout = tree<HierarchyDatum>().nodeSize([NODE_HEIGHT + 46, NODE_WIDTH + 40]);
	layout(root);

	const nodes: Node<AstFlowNodeData>[] = [];
	const edges: Edge[] = [];
	const selectedNodeId = options?.selectedNodeId ?? null;

	root.each((d) => {
		if (d.data.id === "__forest_root__") return;
		nodes.push({
			id: d.data.id,
			type: "ast",
			position: {
				x: (d.y ?? 0) - NODE_WIDTH / 2,
				y: (d.x ?? 0) - NODE_HEIGHT / 2,
			},
			data: {
				label: d.data.node.label,
				kind: d.data.node.kind,
				factIds: d.data.node.factIds ?? [],
				spanPath: d.data.node.span?.path,
				selected: d.data.id === selectedNodeId,
			},
			style: { width: NODE_WIDTH, height: NODE_HEIGHT },
		});
		if (d.parent && d.parent.data.id !== "__forest_root__") {
			edges.push({
				id: `${d.parent.data.id}->${d.data.id}`,
				source: d.parent.data.id,
				target: d.data.id,
				type: "smoothstep",
			});
		}
	});

	return { nodes, edges };
}

export function findAstNode(
	model: AstGraphModel,
	nodeId: string | null | undefined,
): AstGraphNode | null {
	if (!nodeId) return null;
	return model.nodes.find((n) => n.id === nodeId) ?? null;
}

export function factIdsForAstNode(
	model: AstGraphModel,
	nodeId: string | null | undefined,
): string[] {
	return findAstNode(model, nodeId)?.factIds ?? [];
}
