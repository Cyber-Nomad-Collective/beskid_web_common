import { describe, expect, it } from "vitest";

import {
	resolveDagreGraph,
	resolveDagreLayout,
} from "./resolve-dagre.js";

describe("resolveDagreGraph", () => {
	it("prefers the top-level Graph export (dagre v3)", () => {
		const Graph = class {
			constructor() {}
		};
		expect(resolveDagreGraph({ Graph })).toBe(Graph);
	});

	it("falls back to graphlib.Graph (dagre v1 CJS shape)", () => {
		const Graph = class {
			constructor() {}
		};
		expect(resolveDagreGraph({ graphlib: { Graph } })).toBe(Graph);
	});

	it("unwraps default-export interop namespaces", () => {
		const Graph = class {
			constructor() {}
		};
		expect(resolveDagreGraph({ default: { Graph } })).toBe(Graph);
		expect(resolveDagreGraph({ default: { graphlib: { Graph } } })).toBe(
			Graph,
		);
	});

	it("fails closed when Graph is missing (hoisted broken interop)", () => {
		expect(() =>
			resolveDagreGraph({
				layout: () => undefined,
				graphlib: {},
			}),
		).toThrow(/Graph constructor is unavailable/);
	});
});

describe("resolveDagreLayout", () => {
	it("resolves layout from named or default export", () => {
		const layout = () => undefined;
		expect(resolveDagreLayout({ layout })).toBe(layout);
		expect(resolveDagreLayout({ default: { layout } })).toBe(layout);
	});

	it("fails closed when layout is missing", () => {
		expect(() => resolveDagreLayout({})).toThrow(/layout\(\) is unavailable/);
	});
});
