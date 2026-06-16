import { describe, expect, it } from "vitest";
import {
	parseMarkdownSections,
	scaffoldMarkdownSections,
	validateMarkdownContent,
} from "./markdown-content.js";
import { specLevelFromTypeFlag } from "./node-types.js";
import { createSpecNode, defaultManifestForNormativeRepo } from "./scaffold-node.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initWorkspace, validateWorkspace } from "./validate-workspace.js";

describe("node-types", () => {
	it("resolves PascalCase type flags", () => {
		expect(specLevelFromTypeFlag("Domain")).toBe("domain");
		expect(specLevelFromTypeFlag("ADR")).toBe("adr");
	});
});

describe("markdown-content", () => {
	it("parses section headings", () => {
		const sections = parseMarkdownSections("## Overview\n\nHello\n\n## Scope\n\nWorld");
		expect(sections.map((section) => section.id)).toEqual(["overview", "scope"]);
	});

	it("scaffolds required sections", () => {
		const md = scaffoldMarkdownSections(["context", "decision"]);
		expect(md).toContain("## Context");
		expect(md).toContain("## Decision");
	});
});

describe("scaffold-node", () => {
	it("creates markdown node with ADR metadata", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-node-"));
		initWorkspace(dir, defaultManifestForNormativeRepo());
		createSpecNode({
			workspaceDir: dir,
			typeFlag: "Domain",
			slug: "platform-spec/compiler",
			title: "Compiler",
		});
		createSpecNode({
			workspaceDir: dir,
			typeFlag: "Area",
			slug: "platform-spec/compiler/pipeline",
			title: "Pipeline",
			parentSlug: "platform-spec/compiler",
		});
		createSpecNode({
			workspaceDir: dir,
			typeFlag: "Feature",
			slug: "platform-spec/compiler/pipeline/build",
			title: "Build",
			parentSlug: "platform-spec/compiler/pipeline",
		});
		const result = createSpecNode({
			workspaceDir: dir,
			typeFlag: "ADR",
			slug: "platform-spec/compiler/pipeline/build/adr/0001-example",
			title: "Example ADR",
			parentSlug: "platform-spec/compiler/pipeline/build",
		});
		expect(result.node.adrStatus).toBe("Proposed");
		expect(fs.existsSync(path.join(result.nodeDir, "content.md"))).toBe(true);
		const report = validateWorkspace(dir);
		expect(report.ok).toBe(true);
		fs.rmSync(dir, { recursive: true });
	});
});

describe("adr validation", () => {
	it("flags missing ADR fields", () => {
		const manifest = defaultManifestForNormativeRepo();
		const issues = validateMarkdownContent(
			"/tmp",
			manifest,
			{
				version: 1,
				specLevel: "adr",
				slug: "platform-spec/x",
				title: "X",
			},
			"## Context\n\n",
		);
		expect(issues.some((issue) => issue.code.startsWith("adr-"))).toBe(true);
	});
});
