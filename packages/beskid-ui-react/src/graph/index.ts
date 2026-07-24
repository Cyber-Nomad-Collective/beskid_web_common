/** Re-export; canonical home is `@beskid/ui-react/explorer`. */
export {
	type OpenInEditorOptions,
	openInEditorUrl,
} from "../explorer/open-in-editor.js";
export type { AstTreeViewProps } from "./AstTreeView.js";
export { AstTreeView } from "./AstTreeView.js";
export type { FactsDagViewProps } from "./FactsDagView.js";
export { FactsDagView } from "./FactsDagView.js";
export {
	SAMPLE_AST,
	SAMPLE_FACTS_DAG,
	SAMPLE_REPO_TREE,
	sampleAst,
	sampleFacts,
	sampleFactsDag,
	sampleRepo,
	sampleRepoTree,
} from "./fixtures/index.js";
export type { LinkedAstFactsViewProps } from "./LinkedAstFactsView.js";
export { LinkedAstFactsView } from "./LinkedAstFactsView.js";
export type { AstFlowNodeData } from "./layout-ast.js";

export {
	factIdsForAstNode,
	findAstNode,
	layoutAstTree,
} from "./layout-ast.js";
export type { FactsFlowNodeData } from "./layout-dag.js";

export { layoutFactsDag } from "./layout-dag.js";
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
export type { AstFactsLinkState } from "./use-ast-facts-link.js";
export { useAstFactsLink } from "./use-ast-facts-link.js";
