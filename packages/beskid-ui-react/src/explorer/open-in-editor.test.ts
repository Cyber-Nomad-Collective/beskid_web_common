import { describe, expect, it } from "vitest";

import { openInEditorUrl } from "./open-in-editor.js";

describe("openInEditorUrl", () => {
	it("builds cursor local URLs", () => {
		expect(
			openInEditorUrl({
				path: "/Users/dev/beskid/demo.bs",
				line: 5,
				column: 2,
				scheme: "cursor",
			}),
		).toBe("cursor://file/Users/dev/beskid/demo.bs:5:2");
	});

	it("builds vscode local URLs", () => {
		expect(
			openInEditorUrl({ path: "/tmp/x.bs", line: 1, scheme: "vscode" }),
		).toBe("vscode://file/tmp/x.bs:1:1");
	});

	it("builds GitHub blob URLs", () => {
		expect(
			openInEditorUrl({
				path: "compiler/demo.bs",
				line: 12,
				scheme: "github",
				githubRepo: "Cyber-Nomad-Collective/beskid",
				githubRef: "main",
			}),
		).toBe(
			"https://github.com/Cyber-Nomad-Collective/beskid/blob/main/compiler/demo.bs#L12",
		);
	});

	it("supports githubBlobBase option", () => {
		expect(
			openInEditorUrl(
				{ path: "examples/hello.bs", line: 3, scheme: "github" },
				{
					githubBlobBase:
						"https://github.com/Cyber-Nomad-Collective/beskid/blob/main",
				},
			),
		).toBe(
			"https://github.com/Cyber-Nomad-Collective/beskid/blob/main/examples/hello.bs#L3",
		);
	});

	it("prefers local cursor when isLocal and scheme omitted", () => {
		expect(
			openInEditorUrl({ path: "/repo/a.bs", line: 3 }, { isLocal: true }),
		).toBe("cursor://file/repo/a.bs:3:1");
	});

	it("falls back to GitHub when not local", () => {
		expect(
			openInEditorUrl(
				{
					path: "src/demo.bs",
					line: 1,
					githubRepo: "Cyber-Nomad-Collective/beskid",
				},
				{ isLocal: false },
			),
		).toBe(
			"https://github.com/Cyber-Nomad-Collective/beskid/blob/main/src/demo.bs#L1",
		);
	});
});
