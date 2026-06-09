import { describe, expect, it } from "vitest";
import { BUILTIN_WIDGET_REGISTRY, widgetRegistryMap } from "./registry.js";

describe("platform-spec registry", () => {
	it("registers built-in widgets", () => {
		const map = widgetRegistryMap(BUILTIN_WIDGET_REGISTRY);
		expect(map.has("domainTiles")).toBe(true);
		expect(map.has("specSection")).toBe(true);
		expect(map.has("markdownProse")).toBe(true);
		expect(map.has("twoColumn")).toBe(true);
	});
});
