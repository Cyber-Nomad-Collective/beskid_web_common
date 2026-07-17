import { describe, expect, it } from "vitest";

import { sampleAst, sampleFacts } from "./fixtures/index.js";
import {
	factIdsForAstNode,
	findAstNode,
	layoutAstTree,
} from "./layout-ast.js";
import { layoutFactsDag } from "./layout-dag.js";

describe("layoutAstTree", () => {
	it("layouts fixture AST with parent edges", () => {
		const { nodes, edges } = layoutAstTree(sampleAst);
		expect(nodes.length).toBe(sampleAst.nodes.length);
		expect(nodes.some((n) => n.id === "fn_main")).toBe(true);
		expect(
			edges.some((e) => e.source === "fn_main" && e.target === "block_body"),
		).toBe(true);
	});

	it("marks the selected AST node", () => {
		const { nodes } = layoutAstTree(sampleAst, {
			selectedNodeId: "call_print",
		});
		const selected = nodes.find((n) => n.id === "call_print");
		expect(selected?.data.selected).toBe(true);
		expect(selected?.data.factIds).toEqual(["fact_call_print", "fact_str_lit"]);
	});
});

describe("AST → facts linking helpers", () => {
	it("resolves factIds for an AST node", () => {
		expect(factIdsForAstNode(sampleAst, "fn_main")).toEqual(["fact_fn_main"]);
		expect(findAstNode(sampleAst, "missing")).toBeNull();
	});
});

describe("layoutFactsDag", () => {
	it("layouts fixture facts with dagre positions", () => {
		const { nodes, edges } = layoutFactsDag(sampleFacts, {
			highlightedFactIds: ["fact_fn_main", "fact_block"],
		});
		expect(nodes).toHaveLength(sampleFacts.nodes.length);
		expect(edges).toHaveLength(sampleFacts.edges.length);
		const highlighted = nodes.find((n) => n.id === "fact_fn_main");
		expect(highlighted?.data.highlighted).toBe(true);
		expect(typeof highlighted?.position.x).toBe("number");
	});
});
