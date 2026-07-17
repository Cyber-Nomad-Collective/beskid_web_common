export type {
	AstGraphModel,
	AstGraphNode,
	AstNodeModel,
	FactsDagEdge,
	FactsDagLocation,
	FactsDagModel,
	FactsDagNode,
	FactsLocation,
	GraphDataSource,
	OpenInEditorScheme,
	OpenInEditorTarget,
	SourceSpan,
} from "./types.js";

export { AstTreeView } from "./AstTreeView.js";
export type { AstTreeViewProps } from "./AstTreeView.js";

export { FactsDagView } from "./FactsDagView.js";
export type { FactsDagViewProps } from "./FactsDagView.js";

export { LinkedAstFactsView } from "./LinkedAstFactsView.js";
export type { LinkedAstFactsViewProps } from "./LinkedAstFactsView.js";

export { useAstFactsLink } from "./use-ast-facts-link.js";
export type { AstFactsLinkState } from "./use-ast-facts-link.js";

export {
	factIdsForAstNode,
	findAstNode,
	layoutAstTree,
} from "./layout-ast.js";
export type { AstFlowNodeData } from "./layout-ast.js";

export { layoutFactsDag } from "./layout-dag.js";
export type { FactsFlowNodeData } from "./layout-dag.js";

/** Re-export; canonical home is `@beskid/ui-react/explorer`. */
export {
	openInEditorUrl,
	type OpenInEditorOptions,
} from "../explorer/open-in-editor.js";

export {
	sampleAst,
	sampleFacts,
	sampleFactsDag,
	sampleRepo,
	sampleRepoTree,
	SAMPLE_AST,
	SAMPLE_FACTS_DAG,
	SAMPLE_REPO_TREE,
} from "./fixtures/index.js";
