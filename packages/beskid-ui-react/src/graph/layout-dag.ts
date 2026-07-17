import { Graph, layout } from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

import type { FactsDagLocation, FactsDagModel } from "./types.js";

export type FactsFlowNodeData = {
	label: string;
	kind: string;
	location?: FactsDagLocation;
	highlighted: boolean;
	selected: boolean;
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 44;

/**
 * Layout a facts DAG with dagre, producing ReactFlow nodes/edges.
 */
export function layoutFactsDag(
	model: FactsDagModel,
	options?: {
		highlightedFactIds?: readonly string[];
		selectedFactIds?: readonly string[];
		rankdir?: "TB" | "LR";
	},
): { nodes: Node<FactsFlowNodeData>[]; edges: Edge[] } {
	const highlighted = new Set(options?.highlightedFactIds ?? []);
	const selected = new Set(options?.selectedFactIds ?? []);

	const g = new Graph();
	g.setGraph({
		rankdir: options?.rankdir ?? "TB",
		nodesep: 48,
		ranksep: 64,
		marginx: 24,
		marginy: 24,
	});
	g.setDefaultEdgeLabel(() => ({}));

	for (const node of model.nodes) {
		g.setNode(node.id, {
			width: NODE_WIDTH,
			height: NODE_HEIGHT,
			label: node.label,
		});
	}
	for (const edge of model.edges) {
		if (g.hasNode(edge.from) && g.hasNode(edge.to)) {
			g.setEdge(edge.from, edge.to, { label: edge.label });
		}
	}

	layout(g);

	const nodes: Node<FactsFlowNodeData>[] = model.nodes.map((node) => {
		const pos = g.node(node.id);
		return {
			id: node.id,
			type: "fact",
			position: {
				x: (pos?.x ?? 0) - NODE_WIDTH / 2,
				y: (pos?.y ?? 0) - NODE_HEIGHT / 2,
			},
			data: {
				label: node.label,
				kind: node.kind,
				location: node.location,
				highlighted: highlighted.has(node.id),
				selected: selected.has(node.id),
			},
			style: { width: NODE_WIDTH, height: NODE_HEIGHT },
		};
	});

	const edges: Edge[] = model.edges
		.filter((edge) => g.hasNode(edge.from) && g.hasNode(edge.to))
		.map((edge, index) => ({
			id: `${edge.from}->${edge.to}:${index}`,
			source: edge.from,
			target: edge.to,
			label: edge.label,
			type: "smoothstep",
			animated:
				highlighted.has(edge.from) ||
				highlighted.has(edge.to) ||
				selected.has(edge.from) ||
				selected.has(edge.to),
		}));

	return { nodes, edges };
}
