import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { sampleAst } from "./fixtures/index.js";
import { useAstFactsLink } from "./use-ast-facts-link.js";

describe("useAstFactsLink", () => {
	it("highlights factIds when an AST node is selected", () => {
		const { result } = renderHook(() => useAstFactsLink(sampleAst));

		act(() => {
			result.current.selectAstNode("call_print");
		});

		expect(result.current.selectedAstNodeId).toBe("call_print");
		expect(result.current.highlightedFactIds).toEqual([
			"fact_call_print",
			"fact_str_lit",
		]);
		expect(result.current.selectedFactIds).toEqual([
			"fact_call_print",
			"fact_str_lit",
		]);
	});

	it("clears selection", () => {
		const { result } = renderHook(() => useAstFactsLink(sampleAst));
		act(() => {
			result.current.selectAstNode("fn_main");
		});
		act(() => {
			result.current.clearSelection();
		});
		expect(result.current.selectedAstNodeId).toBeNull();
		expect(result.current.highlightedFactIds).toEqual([]);
	});
});
