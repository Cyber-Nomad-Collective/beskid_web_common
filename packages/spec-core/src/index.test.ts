import { describe, expect, it } from "vitest";
import { widgetsToGrid, gridToWidgets } from "./grid-layout.js";
import { emitBodyMd, emitMdxFile } from "./emit-mdx.js";
import { splitMdxFrontmatter } from "./import-legacy-mdx.js";
import { DEFAULT_WORKSPACE_MANIFEST, parseWorkspaceManifest } from "./workspace/schema.js";
import { validateWorkspace, initWorkspace } from "./validate-workspace.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("grid-layout", () => {
	it("round-trips widgets through grid", () => {
		const widgets = [
			{
				type: "domainTiles" as const,
				props: { pathPrefix: "platform-spec/compiler", heading: "Areas" },
			},
		];
		const grid = widgetsToGrid(widgets);
		expect(grid.items).toHaveLength(1);
		expect(gridToWidgets(grid)).toEqual(widgets);
	});
});

describe("emit-mdx", () => {
	it("emits spec sections from content blocks", () => {
		const body = emitBodyMd({
			version: 1,
			blocks: [
				{ type: "specSection", id: "rationale", bodyMd: "Because." },
			],
		});
		expect(body).toContain('<SpecSection id="rationale">');
		expect(body).toContain("Because.");
	});

	it("emits full MDX file", () => {
		const mdx = emitMdxFile(
			{
				version: 1,
				specLevel: "domain",
				slug: "platform-spec/compiler",
				title: "Compiler",
				description: "Compiler domain",
			},
			{
				version: 1,
				blocks: [
					{ type: "specSection", id: "rationale", bodyMd: "Normative compiler spec." },
				],
			},
		);
		expect(mdx.startsWith("---")).toBe(true);
		expect(mdx).toContain("title: Compiler");
		expect(mdx).toContain('<SpecSection id="rationale">');
	});
});

describe("import-legacy-mdx", () => {
	it("parses frontmatter", () => {
		const raw = `---\ntitle: Test\nspecLevel: domain\n---\n\n## Hello\n`;
		const { frontmatter, body } = splitMdxFrontmatter(raw);
		expect(frontmatter.title).toBe("Test");
		expect(body).toContain("## Hello");
	});
});

describe("validate-workspace", () => {
	it("validates initialized workspace", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spec-core-"));
		initWorkspace(dir);
		const report = validateWorkspace(dir);
		expect(report.ok).toBe(true);
		expect(report.nodeCount).toBe(1);
		fs.rmSync(dir, { recursive: true });
	});
});

describe("workspace manifest", () => {
	it("parses default manifest", () => {
		const manifest = parseWorkspaceManifest(DEFAULT_WORKSPACE_MANIFEST);
		expect(manifest.origin).toBe("https://spec.beskid-lang.org");
		expect(manifest.nodeTypes.domain).toBeDefined();
	});
});
