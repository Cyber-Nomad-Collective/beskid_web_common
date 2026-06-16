/** Built-in architecture component kinds. */
export const ARCHITECTURE_COMPONENT_KINDS = [
	"service",
	"dependency",
	"compilerPipelineStage",
	"rustModule",
	"beskidProject",
	"beskidWorkspace",
	"specNode",
	"astSyntaxNode",
	"group",
] as const;

export type ArchitectureComponentKind =
	(typeof ARCHITECTURE_COMPONENT_KINDS)[number];

/** Built-in typed relation kinds between graph nodes. */
export const ARCHITECTURE_RELATION_KINDS = [
	"feeds",
	"dependsOn",
	"contains",
	"lowersTo",
	"calls",
	"referencesSpec",
	"vendoredFrom",
	"implements",
	"relatesTo",
] as const;

export type ArchitectureRelationKind =
	(typeof ARCHITECTURE_RELATION_KINDS)[number];

/** Outbound typed links attached to a node. */
export const ARCHITECTURE_LINK_KINDS = [
	"specNode",
	"deployUrl",
	"githubRepo",
	"cratePath",
	"workspaceRoot",
	"rustModule",
] as const;

export type ArchitectureLinkKind = (typeof ARCHITECTURE_LINK_KINDS)[number];

export const COMPILER_PIPELINE_PHASES = [
	"resolve",
	"parse",
	"lower",
	"codegen",
	"jit",
	"aot",
	"lsp",
] as const;

export type CompilerPipelinePhase = (typeof COMPILER_PIPELINE_PHASES)[number];

export const DEPENDENCY_SOURCES = ["workspace", "registry", "git"] as const;
export type DependencySource = (typeof DEPENDENCY_SOURCES)[number];

export const AST_SYNTAX_FAMILIES = [
	"Expression",
	"Statement",
	"Item",
	"Type",
] as const;

export type AstSyntaxFamily = (typeof AST_SYNTAX_FAMILIES)[number];
