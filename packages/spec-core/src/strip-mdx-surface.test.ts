import { describe, expect, it } from "vitest";
import { stripMdxPresentationSurface } from "./strip-mdx-surface.js";

describe("strip-mdx-surface", () => {
	it("removes Astro imports and ADR chrome", () => {
		const raw = `import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Hand-written frontmatter drifted.`;
		expect(stripMdxPresentationSurface(raw)).toBe(`## Context

Hand-written frontmatter drifted.`);
	});

	it("removes SpecPageHeader with attributes", () => {
		const raw = `import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';

<SpecPageHeader status="Standard" ownerName="A" ownerEmail="a@b.c" submitterName="A" submitterEmail="a@b.c" />

Intro prose.`;
		expect(stripMdxPresentationSurface(raw)).toBe("Intro prose.");
	});

	it("removes SpecArticleChrome", () => {
		const raw = `import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## What this covers

Normative text.`;
		expect(stripMdxPresentationSurface(raw)).toBe(`## What this covers

Normative text.`);
	});

	it("removes DomainTiles tags", () => {
		const raw = `<DomainTiles pathPrefix="platform-spec/compiler" heading="Areas" />

## Rationale

Because.`;
		expect(stripMdxPresentationSurface(raw)).toBe(`## Rationale

Because.`);
	});
});

describe("import body normalization", () => {
	it("strips chrome when parsing ADR body", async () => {
		const { splitMdxFrontmatter } = await import("./import-legacy-mdx.js");
		const { frontmatter, body } = splitMdxFrontmatter(`---
title: Test ADR
specLevel: adr
---

import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Context text.
`);
		expect(frontmatter.title).toBe("Test ADR");
		expect(stripMdxPresentationSurface(body)).toContain("## Context");
		expect(stripMdxPresentationSurface(body)).not.toContain("SpecAdrChrome");
	});
});
