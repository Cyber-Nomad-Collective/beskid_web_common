/**
 * Resolve `@dagrejs/dagre` Graph + layout across ESM/CJS interop shapes.
 *
 * Hoisted v1 packages export `{ graphlib, layout, ... }` without a top-level
 * `Graph`. Vite SSR named-import interop then yields `gm.Graph` as undefined
 * ("gm.Graph is not a constructor"). Prefer the v3 named `Graph` export;
 * fall back to `graphlib.Graph` only when present, and fail closed otherwise.
 */

type DagreGraphOptions = {
	directed?: boolean;
	multigraph?: boolean;
	compound?: boolean;
};

export type DagreGraphInstance = {
	setGraph: (label: Record<string, unknown>) => unknown;
	setDefaultEdgeLabel: (factory: () => Record<string, unknown>) => unknown;
	setNode: (id: string, label: Record<string, unknown>) => unknown;
	setEdge: (
		from: string,
		to: string,
		label?: Record<string, unknown>,
	) => unknown;
	hasNode: (id: string) => boolean;
	node: (id: string) => { x?: number; y?: number } | undefined;
};

export type DagreGraphConstructor = new (
	options?: DagreGraphOptions,
) => DagreGraphInstance;

export type DagreLayout = (graph: DagreGraphInstance) => unknown;

type DagreModuleShape = {
	Graph?: unknown;
	layout?: unknown;
	graphlib?: { Graph?: unknown };
	default?: {
		Graph?: unknown;
		layout?: unknown;
		graphlib?: { Graph?: unknown };
	};
};

function asConstructor(value: unknown): DagreGraphConstructor | null {
	return typeof value === "function" ? (value as DagreGraphConstructor) : null;
}

function asLayout(value: unknown): DagreLayout | null {
	return typeof value === "function" ? (value as DagreLayout) : null;
}

export function resolveDagreGraph(
	mod: DagreModuleShape,
): DagreGraphConstructor {
	const GraphCtor =
		asConstructor(mod.Graph) ??
		asConstructor(mod.default?.Graph) ??
		asConstructor(mod.graphlib?.Graph) ??
		asConstructor(mod.default?.graphlib?.Graph);

	if (!GraphCtor) {
		throw new Error(
			"@dagrejs/dagre Graph constructor is unavailable. Pin @dagrejs/dagre@^3.0.0 and avoid hoisting v1 (no top-level Graph export).",
		);
	}
	return GraphCtor;
}

export function resolveDagreLayout(mod: DagreModuleShape): DagreLayout {
	const layoutFn = asLayout(mod.layout) ?? asLayout(mod.default?.layout);

	if (!layoutFn) {
		throw new Error(
			"@dagrejs/dagre layout() is unavailable. Pin @dagrejs/dagre@^3.0.0.",
		);
	}
	return layoutFn;
}
