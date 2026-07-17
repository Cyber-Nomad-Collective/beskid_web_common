/** Shared AST / facts-DAG contracts for fixture and live compiler adapters. */

export type SourceSpan = {
	path?: string;
	line: number;
	column?: number;
	endLine?: number;
	endColumn?: number;
};

export type AstGraphNode = {
	id: string;
	kind: string;
	label: string;
	span?: SourceSpan;
	factIds?: string[];
	/** Child node ids (flat adjacency). */
	children?: string[];
};

export type AstGraphModel = {
	roots: string[];
	nodes: AstGraphNode[];
};

/** @deprecated Prefer AstGraphNode */
export type AstNodeModel = AstGraphNode;

export type FactsDagLocation = {
	path: string;
	line?: number;
	column?: number;
};

/** @deprecated Prefer FactsDagLocation */
export type FactsLocation = FactsDagLocation;

export type FactsDagNode = {
	id: string;
	kind: string;
	label: string;
	location?: FactsDagLocation;
};

export type FactsDagEdge = {
	from: string;
	to: string;
	label?: string;
};

export type FactsDagModel = {
	nodes: FactsDagNode[];
	edges: FactsDagEdge[];
};

/** Adapter seam so live compiler/LSP can fill the same props later. */
export type GraphDataSource = {
	loadAst?: (path: string) => Promise<AstGraphModel | null>;
	loadFacts?: (path: string) => Promise<FactsDagModel | null>;
};

export type {
	OpenInEditorScheme,
	OpenInEditorTarget,
} from "../explorer/types.js";
