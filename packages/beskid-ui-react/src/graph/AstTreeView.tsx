"use client";

import {
	Background,
	Controls,
	Handle,
	MiniMap,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";

import { cn } from "../lib/utils.js";
import { type AstFlowNodeData, layoutAstTree } from "./layout-ast.js";
import type { AstGraphModel } from "./types.js";

export type AstTreeViewProps = {
	model: AstGraphModel;
	className?: string;
	/** Optional: outline AST nodes whose factIds intersect this set. */
	highlightedFactIds?: readonly string[];
	selectedNodeId?: string | null;
	onNodeSelect?: (nodeId: string, factIds: string[]) => void;
	fitView?: boolean;
};

function AstNodeCard({ data, selected }: NodeProps<Node<AstFlowNodeData>>) {
	return (
		<div
			className={cn(
				"flex h-full w-full flex-col justify-center rounded-md border px-2 py-1 text-left shadow-sm",
				selected || data.selected
					? "border-primary bg-primary/10"
					: "border-border bg-card text-card-foreground",
			)}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="!bg-muted-foreground"
			/>
			<span className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
				{data.kind}
			</span>
			<span className="truncate text-xs font-medium">{data.label}</span>
			<Handle
				type="source"
				position={Position.Bottom}
				className="!bg-muted-foreground"
			/>
		</div>
	);
}

const nodeTypes = { ast: AstNodeCard };

/**
 * Interactive AST tree viewer (ReactFlow + d3-hierarchy layout).
 * Click a node to surface its `factIds` for facts-DAG linking.
 */
export function AstTreeView({
	model,
	className,
	highlightedFactIds,
	selectedNodeId = null,
	onNodeSelect,
	fitView = true,
}: AstTreeViewProps) {
	const { nodes: laidOut, edges } = useMemo(
		() => layoutAstTree(model, { selectedNodeId }),
		[model, selectedNodeId],
	);

	const highlight = useMemo(
		() => new Set(highlightedFactIds ?? []),
		[highlightedFactIds],
	);

	const nodes = useMemo(
		() =>
			laidOut.map((n) => {
				const factIds = n.data.factIds ?? [];
				const isHighlight =
					highlight.size > 0 && factIds.some((id) => highlight.has(id));
				return {
					...n,
					selected: selectedNodeId === n.id,
					style: {
						...n.style,
						outline: isHighlight
							? "2px solid var(--color-primary, #2563eb)"
							: undefined,
					},
				};
			}),
		[laidOut, highlight, selectedNodeId],
	);

	const onNodeClick = useCallback(
		(_: React.MouseEvent, node: Node) => {
			const data = node.data as AstFlowNodeData;
			onNodeSelect?.(node.id, data.factIds ?? []);
		},
		[onNodeSelect],
	);

	return (
		<div
			className={cn("h-[320px] w-full rounded-lg border border-border", className)}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodeClick={onNodeClick}
				fitView={fitView}
				minZoom={0.3}
				proOptions={{ hideAttribution: true }}
			>
				<Background gap={16} size={1} />
				<Controls showInteractive={false} />
				<MiniMap pannable zoomable />
			</ReactFlow>
		</div>
	);
}
