import { describe, expect, it } from "vitest";
import { validateBodyWithMdshape } from "./mdshape-schemas.js";
import { stripGeneratedRegions } from "./generate-hub-sections.js";

describe("mdshape-schemas", () => {
	it("accepts a complete ADR body", () => {
		const body = `## Context

Normative context.

## Decision

We decided.

## Consequences

Follow-up work.`;
		expect(validateBodyWithMdshape("adr", body)).toEqual([]);
	});

	it("warns via caller when ADR sections lack paragraphs", () => {
		const body = `## Context

## Decision

## Consequences
`;
		const issues = validateBodyWithMdshape("adr", body);
		expect(issues.length).toBeGreaterThan(0);
		expect(issues[0]?.code).toBe("mdshape-body");
	});

	it("validates feature hub prose without generated list payloads", () => {
		const body = `## Summary

Hub summary.

## Decisions
<!-- spec:generate:adr-index -->
- [ADR](./adr/0001/)
<!-- /spec:generate:adr-index -->

## Articles
<!-- spec:generate:article-index -->
- [Article](./articles/foo/)
<!-- /spec:generate:article-index -->`;
		const stripped = stripGeneratedRegions(body);
		expect(validateBodyWithMdshape("feature", stripped)).toEqual([]);
	});
});
