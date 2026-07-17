"use client";

import {
	Background,
	Controls,
	MiniMap,
	ReactFlow,
	Handle,
	Position,
	type Node,
	type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";

import { cn } from "../lib/utils.js";
import {
	openInEditorUrl,
	type OpenInEditorOptions,
} from "../explorer/open-in-editor.js";
import { layoutFactsDag, type FactsFlowNodeData } from "./layout-dag.js";
import type { FactsDagModel, FactsDagNode } from "./types.js";

export type FactsDagViewProps = {
	model: FactsDagModel;
	/** Fact ids highlighted from an AST selection (AST → facts linking). */
	highlightedNodeIds?: readonly string[];
	/** @deprecated Prefer highlightedNodeIds */
	highlightedFactIds?: readonly string[];
	selectedNodeId?: string | null;
	selectedFactIds?: readonly string[];
	onFactSelect?: (node: FactsDagNode | null) => void;
	/** When set (not false), clicking a fact with location opens an editor URL. */
	openInEditor?: OpenInEditorOptions | false;
	className?: string;
	fitView?: boolean;
	rankdir?: "TB" | "LR";
};

function FactNodeCard({ data, selected }: NodeProps<Node<FactsFlowNodeData>>) {
	return (
		<div
			className={cn(
				"flex h-full w-full flex-col justify-center rounded-md border px-2 py-1 text-left shadow-sm",
				"border-border bg-card text-card-foreground",
				data.highlighted && "border-amber-600/70 bg-amber-500/10 dark:border-amber-400/60",
				(selected || data.selected) && "border-primary ring-2 ring-primary/40",
			)}
		>
			<Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
			<span className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
				{data.kind}
			</span>
			<span className="truncate text-xs font-medium">{data.label}</span>
			<Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
		</div>
	);
}

const nodeTypes = { fact: FactNodeCard };

/**
 * Interactive facts DAG viewer (ReactFlow + dagre layout).
 * Pass `highlightedNodeIds` from an AST node click to link the two views.
 */
export function FactsDagView({
	model,
	highlightedNodeIds,
	highlightedFactIds,
	selectedNodeId = null,
	selectedFactIds,
	onFactSelect,
	openInEditor,
	className,
	fitView = true,
	rankdir = "TB",
}: FactsDagViewProps) {
	const highlighted = highlightedNodeIds ?? highlightedFactIds;
	const selectedIds = useMemo(() => {
		if (selectedFactIds?.length) {
			return selectedFactIds;
		}
		return selectedNodeId ? [selectedNodeId] : [];
	}, [selectedFactIds, selectedNodeId]);

	const { nodes, edges } = useMemo(
		() =>
			layoutFactsDag(model, {
				highlightedFactIds: highlighted,
				selectedFactIds: selectedIds,
				rankdir,
			}),
		[model, highlighted, selectedIds, rankdir],
	);

	const handleNodeClick = useCallback(
		(_: React.MouseEvent, node: Node) => {
			const found = model.nodes.find((n) => n.id === node.id) ?? null;
			onFactSelect?.(found);

			if (openInEditor === false || openInEditor == null || !found?.location) {
				return;
			}
			try {
				const url = openInEditorUrl(
					{
						path: found.location.path,
						line: found.location.line,
						column: found.location.column,
					},
					openInEditor,
				);
				if (typeof window !== "undefined") {
					window.open(url, "_blank", "noopener,noreferrer");
				}
			} catch {
				// Missing githubRepo in public docs — ignore; consumer can handle via onFactSelect.
			}
		},
		[model, onFactSelect, openInEditor],
	);

	return (
		<div className={cn("h-[320px] w-full rounded-lg border border-border", className)}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodeClick={handleNodeClick}
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
