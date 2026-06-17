"use client";

import type { ArchitectureComponent, ArchitectureGraphV2, ArchitectureRelation, ArchitectureLink } from "@cyber-nomad-collective/spec-core";
import { isArchitectureGraphV2, normalizeArchitectureGraph } from "@cyber-nomad-collective/spec-core";

import { useCallback, useEffect, useMemo, useState } from "react";
import dagre from "@dagrejs/dagre";
import {
	ReactFlow,
	type Edge,
	type Node,
	type NodeProps,
	type EdgeProps,
	Background,
	Controls,
	Handle,
	Position,
	ReactFlowProvider,
	useReactFlow,
	EdgeLabelRenderer,
	getBezierPath,
	MarkerType,
} from "@xyflow/react";

import type { CompilerPipelinePhase, DependencySource, ArchitectureComponentKind } from "@cyber-nomad-collective/spec-core";

const NODE_WIDTH = 240;
const NODE_HEIGHT = 88;

function phaseBadgeClass(phase: string): string {
	switch (phase) {
		case "resolve":
			return "bg-blue-500/15 text-blue-200 border-blue-400/30";
		case "parse":
			return "bg-violet-500/15 text-violet-200 border-violet-400/30";
		case "lower":
			return "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30";
		case "codegen":
			return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
		case "jit":
			return "bg-amber-500/15 text-amber-200 border-amber-400/30";
		case "aot":
			return "bg-teal-500/15 text-teal-200 border-teal-400/30";
		case "lsp":
			return "bg-sky-500/15 text-sky-200 border-sky-400/30";
		default:
			return "bg-muted/30 text-muted-foreground border-border/60";
	}
}

function truncate(text: string, max = 64): string {
	const s = String(text ?? "");
	if (s.length <= max) return s;
	return `${s.slice(0, max - 1)}…`;
}

function resolveArchitectureLinkHref(link: ArchitectureLink): string | null {
	switch (link.kind) {
		case "deployUrl":
			return link.url;
		case "githubRepo": {
			const path = link.path ? `/${link.path.replace(/^\//, "")}` : "";
			return `https://github.com/${link.owner}/${link.repo}${path}`;
		}
		default:
			return null;
	}
}

function layoutGraph(graph: ArchitectureGraphV2): Map<string, { x: number; y: number }> {
	const visibleNodes = graph.nodes.filter((n) => !n.hidden);
	const visibleIds = new Set(visibleNodes.map((n) => n.id));
	if (!visibleNodes.length) return new Map();

	const g = new dagre.graphlib.Graph();
	g.setGraph({
		rankdir: "TB",
		nodesep: 52,
		ranksep: 80,
		edgesep: 24,
		marginx: 32,
		marginy: 32,
	});
	g.setDefaultEdgeLabel(() => ({}));

	for (const node of visibleNodes) {
		g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
	}

	for (const edge of graph.edges) {
		if (edge.hidden) continue;
		if (visibleIds.has(edge.from) && visibleIds.has(edge.to)) {
			g.setEdge(edge.from, edge.to, { label: edge.label });
		}
	}

	dagre.layout(g);

	const pos = new Map<string, { x: number; y: number }>();
	for (const id of g.nodes()) {
		const n = g.node(id);
		if (!n) continue;
		pos.set(id, { x: n.x - n.width / 2, y: n.y - n.height / 2 });
	}
	return pos;
}

function ArchitectureNodeChrome({ component }: { component: ArchitectureComponent }) {
	switch (component.kind) {
		case "service": {
			const p = component.props;
			return (
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<div className="text-sm font-semibold">{p.name}</div>
						{p.deployEnv ? (
							<span className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
								{p.deployEnv}
							</span>
						) : null}
					</div>
					<div className="text-xs text-muted-foreground">{p.host}</div>
				</div>
			);
		}
		case "dependency": {
			const p = component.props;
			return (
				<div className="space-y-2">
					<div className="text-sm font-semibold">{p.crate}</div>
					<div className="text-xs text-muted-foreground">{truncate(component.description ?? p.purpose, 52)}</div>
					{p.vendored ? (
						<span className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
							vendored
						</span>
					) : null}
				</div>
			);
		}
		case "compilerPipelineStage": {
			const p = component.props;
			return (
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<div className="text-sm font-semibold">{component.label}</div>
						<span className={`rounded border px-2 py-0.5 text-[10px] ${phaseBadgeClass(p.phase)}`}>
							{p.phase}
						</span>
					</div>
					<div className="text-xs text-muted-foreground">
						{p.crate}: {truncate(p.entry, 40)}
					</div>
				</div>
			);
		}
		case "rustModule": {
			const p = component.props;
			return (
				<div className="space-y-2">
					<div className="text-sm font-semibold">{truncate(p.modulePath, 28)}</div>
					<div className="text-xs text-muted-foreground">{p.crate}</div>
				</div>
			);
		}
		case "beskidProject":
		case "beskidWorkspace": {
			const p = component.props;
			return (
				<div className="space-y-2">
					<div className="text-sm font-semibold">{component.label}</div>
					<div className="text-xs text-muted-foreground">{truncate(p.manifestPath, 56)}</div>
				</div>
			);
		}
		case "specNode": {
			const p = component.props;
			return (
				<div className="space-y-2">
					<div className="text-sm font-semibold">{truncate(component.label, 32)}</div>
					<div className="text-xs text-muted-foreground">{p.slug}</div>
				</div>
			);
		}
		case "astSyntaxNode": {
			const p = component.props;
			return (
				<div className="space-y-2">
					<div className="text-sm font-semibold">{p.syntaxKind}</div>
					<div className="text-xs text-muted-foreground">{p.family}</div>
				</div>
			);
		}
		case "group": {
			return <div className="text-sm font-semibold">{component.label}</div>;
		}
		default: {
			const _exhaustive: never = component;
			return null;
		}
	}
}

function ArchitectureNode(props: NodeProps<any>) {
	const component = props.data?.component as ArchitectureComponent;
	return (
		<div
			className={[
				"architecture-graph-node rounded-lg border border-border/70 bg-card p-3 shadow-sm",
				component.hidden ? "opacity-40" : "opacity-100",
			]
				.filter(Boolean)
				.join(" ")}
		>
			{component ? <ArchitectureNodeChrome component={component} /> : null}
			<Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-muted-foreground/60" />
			<Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-muted-foreground/60" />
		</div>
	);
}

function ArchitectureEdge(props: EdgeProps<any>) {
	const relation = props.data?.relation as ArchitectureRelation | undefined;
	if (!relation) return null;
	const [edgePath] = getBezierPath(props);

	let stroke = "var(--pf-border-color)";
	let strokeDasharray: string | undefined;
	let strokeWidth = 1.5;

	switch (relation.kind) {
		case "dependsOn":
			strokeDasharray = "6 4";
			strokeWidth = 1.4;
			break;
		case "contains":
			strokeWidth = 3;
			break;
		case "referencesSpec":
			strokeDasharray = "2 4";
			break;
		default:
			break;
	}

	const label = relation?.label ?? relation?.description;

	return (
		<>
			<path
				id={props.id}
				className="react-flow__edge-path"
				d={edgePath}
				style={{
					stroke,
					strokeWidth,
					strokeDasharray,
				}}
				markerEnd={`url(#reactflow__arrow-${props.id})`}
			/>
			<EdgeLabelRenderer>
				{label ? (
					<div
						style={{
							transform: `translate(-50%, -50%) translate(${(props.sourceX! + props.targetX!) / 2}px, ${(props.sourceY! + props.targetY!) / 2}px)`,
							fontSize: 10,
							color: "var(--pf-text-muted)",
							whiteSpace: "nowrap",
							pointerEvents: "none",
						}}
					>
						{truncate(label, 26)}
					</div>
				) : null}
			</EdgeLabelRenderer>
		</>
	);
}

function FitViewOnLoad({ entryNodeId }: { entryNodeId?: string }) {
	const rf = useReactFlow();
	useEffect(() => {
		if (!rf) return;
		requestAnimationFrame(() => {
			try {
				if (entryNodeId) {
					rf.fitView({ nodes: [{ id: entryNodeId }] as any, padding: 0.2 });
				} else {
					rf.fitView({ padding: 0.2 });
				}
			} catch {
				// If fitView fails (e.g. no nodes), ignore.
			}
		});
	}, [rf, entryNodeId]);
	return null;
}

export interface ArchitectureGraphCanvasProps {
	graph: unknown;
	entryNodeId?: string;
	className?: string;
}

export function ArchitectureGraphCanvas({
	graph: rawGraph,
	entryNodeId,
	className,
}: ArchitectureGraphCanvasProps) {
	const graph = useMemo<ArchitectureGraphV2 | null>(() => {
		if (isArchitectureGraphV2(rawGraph)) return rawGraph;
		try {
			return normalizeArchitectureGraph(rawGraph);
		} catch {
			return null;
		}
	}, [rawGraph]);

	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
		entryNodeId ?? null,
	);

	const nodeById = useMemo(() => {
		if (!graph) return new Map<string, ArchitectureComponent>();
		return new Map(graph.nodes.map((n) => [n.id, n]));
	}, [graph]);

	const edgesByNode = useMemo(() => {
		if (!graph) return { in: new Map<string, ArchitectureRelation[]>(), out: new Map<string, ArchitectureRelation[]>() };
		const inMap = new Map<string, ArchitectureRelation[]>();
		const outMap = new Map<string, ArchitectureRelation[]>();
		for (const e of graph.edges) {
			if (e.hidden) continue;
			if (!inMap.has(e.to)) inMap.set(e.to, []);
			inMap.get(e.to)!.push(e);
			if (!outMap.has(e.from)) outMap.set(e.from, []);
			outMap.get(e.from)!.push(e);
		}
		return { in: inMap, out: outMap };
	}, [graph]);

	const rfNodesAndEdges = useMemo(() => {
		if (!graph) return { rfNodes: [] as any[], rfEdges: [] as any[] };

		const pos = layoutGraph(graph);

		const rfNodes: any[] = graph.nodes
			.filter((n) => !n.hidden)
			.map((n) => {
				const p = pos.get(n.id);
				return {
					id: n.id,
					type: n.kind,
					position: p ? { x: p.x, y: p.y } : { x: 0, y: 0 },
					data: { component: n },
					draggable: false,
					connectable: false,
				};
			});

		const rfEdges: any[] = graph.edges
			.filter((e) => !e.hidden)
			.map((e) => {
				const edgeType = e.kind;
				return {
					id: e.id ?? `${e.kind}-${e.from}-${e.to}`,
					type: edgeType,
					source: e.from,
					target: e.to,
					label: e.label,
					data: { relation: e },
					markerEnd: MarkerType.ArrowClosed,
				};
			});

		return { rfNodes, rfEdges };
	}, [graph]);

	const nodeTypes = useMemo(() => {
		// All node kinds use the same chrome component, but node.kind is used as type key.
		const map: Record<string, any> = {};
		for (const kind of [
			"service",
			"dependency",
			"compilerPipelineStage",
			"rustModule",
			"beskidProject",
			"beskidWorkspace",
			"specNode",
			"astSyntaxNode",
			"group",
		]) {
			map[kind] = ArchitectureNode;
		}
		return map;
	}, []);

	const edgeTypes = useMemo(() => {
		const map: Record<string, any> = {};
		for (const kind of [
			"feeds",
			"dependsOn",
			"contains",
			"lowersTo",
			"calls",
			"referencesSpec",
			"vendoredFrom",
			"implements",
			"relatesTo",
		]) {
			map[kind] = ArchitectureEdge;
		}
		return map;
	}, []);

	const onNodeClick = useCallback((_: unknown, node: any) => {
		setSelectedNodeId(String(node.id));
	}, []);

	const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) : undefined;

	const selectedIn = selectedNode ? edgesByNode.in.get(selectedNode.id) ?? [] : [];
	const selectedOut = selectedNode ? edgesByNode.out.get(selectedNode.id) ?? [] : [];

	const selectedLinks = selectedNode?.links ?? [];

	return graph ? (
		<div className={["architecture-graph-canvas flex gap-4", className ?? ""].filter(Boolean).join(" ")}>
			<div className="relative h-[70vh] flex-1 rounded-lg border border-border/70 bg-card">
				<ReactFlowProvider>
					<ReactFlow
						nodes={rfNodesAndEdges.rfNodes}
						edges={rfNodesAndEdges.rfEdges}
						nodeTypes={nodeTypes}
						edgeTypes={edgeTypes}
						fitView
						onNodeClick={onNodeClick as any}
						nodesDraggable={false}
						zoomOnScroll
					>
						<FitViewOnLoad entryNodeId={entryNodeId} />
						<Background />
						<Controls />
					</ReactFlow>
				</ReactFlowProvider>
			</div>

			<aside className="w-[320px] shrink-0 rounded-lg border border-border/70 bg-card p-4">
				{selectedNode ? (
					<div className="space-y-3">
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="text-sm font-semibold">{selectedNode.label}</div>
								<div className="text-xs text-muted-foreground capitalize">{selectedNode.kind}</div>
							</div>
							<button
								type="button"
								className="rounded border border-border/60 bg-muted/30 px-2 py-1 text-xs text-muted-foreground"
								onClick={() => setSelectedNodeId(null)}
							>
								Close
							</button>
						</div>

						{selectedNode.description ? (
							<p className="text-sm text-muted-foreground">{selectedNode.description}</p>
						) : null}

						{selectedLinks.length > 0 ? (
							<div className="space-y-2">
								<div className="text-xs font-semibold text-muted-foreground">Links</div>
								<ul className="space-y-1 text-sm">
									{selectedLinks.map((l, idx) => {
										const href = resolveArchitectureLinkHref(l);
										const label = l.kind === "specNode" ? l.slug : l.kind;
										return (
											<li key={idx}>
												{href ? (
													<a className="underline underline-offset-2" href={href} target="_blank" rel="noreferrer">
														{label}
													</a>
												) : (
													<span className="text-muted-foreground">{label}</span>
												)}
											</li>
										);
									})}
								</ul>
							</div>
						) : null}

						<div className="space-y-2">
							<div className="text-xs font-semibold text-muted-foreground">Relations</div>
							<div className="space-y-2">
								<div className="text-xs text-muted-foreground">Inbound</div>
								{selectedIn.length ? (
									<ul className="space-y-1 text-sm">
										{selectedIn.map((e) => (
											<li key={e.id ?? `${e.kind}-${e.from}-${e.to}`}>
												<span className="font-medium capitalize">{e.kind}</span>
												<span className="text-muted-foreground">: {e.from}</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-sm text-muted-foreground">None</p>
								)}
							</div>
							<div className="space-y-2">
								<div className="text-xs text-muted-foreground">Outbound</div>
								{selectedOut.length ? (
									<ul className="space-y-1 text-sm">
										{selectedOut.map((e) => (
											<li key={e.id ?? `${e.kind}-${e.from}-${e.to}`}>
												<span className="font-medium capitalize">{e.kind}</span>
												<span className="text-muted-foreground">: {e.to}</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-sm text-muted-foreground">None</p>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="text-sm text-muted-foreground">
						Click a node to inspect typed relations.
					</div>
				)}
			</aside>
		</div>
	) : (
		<div className={["architecture-graph-canvas rounded-lg border border-border/70 bg-card p-4", className ?? ""].filter(Boolean).join(" ")}>
			Failed to load architecture graph.
		</div>
	);
}

