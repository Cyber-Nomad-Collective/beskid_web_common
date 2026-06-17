import fs from "node:fs";
import path from "node:path";
import { SPEC_LAYOUT_FILE, SPEC_MARKDOWN_FILE } from "./constants.js";
import { parseLayoutFile, type LayoutFile } from "./grid-layout.js";
import { scaffoldMarkdownSections } from "./markdown-content.js";
import type { NodeMetadata } from "./node/schema.js";
import type { WorkspaceManifest } from "./workspace/schema.js";

export interface LayoutBoilerplateResult {
	created: boolean;
	sections: string[];
	markdownPath: string;
}

function sectionIdsFromLayout(layout: LayoutFile): string[] {
	const ids = new Set<string>();

	for (const section of layout.sections ?? []) {
		if (section.id) ids.add(section.id);
	}

	return [...ids];
}

/** Validate layout.json and scaffold content.md sections when missing. */
export function applyLayoutBoilerplate(input: {
	nodeDir: string;
	manifest: WorkspaceManifest;
	node: NodeMetadata;
	overwrite?: boolean;
}): LayoutBoilerplateResult {
	const layoutPath = path.join(input.nodeDir, SPEC_LAYOUT_FILE);
	if (!fs.existsSync(layoutPath)) {
		throw new Error(`Missing ${layoutPath}`);
	}

	const layout = parseLayoutFile(
		JSON.parse(fs.readFileSync(layoutPath, "utf8")),
		layoutPath,
	);
	const sectionIds = sectionIdsFromLayout(layout);
	const markdownPath = path.join(input.nodeDir, SPEC_MARKDOWN_FILE);

	if (fs.existsSync(markdownPath) && !input.overwrite) {
		return { created: false, sections: sectionIds, markdownPath };
	}

	const markdown = scaffoldMarkdownSections(sectionIds);
	fs.writeFileSync(
		markdownPath,
		markdown.endsWith("\n") ? markdown : `${markdown}\n`,
	);

	return { created: true, sections: sectionIds, markdownPath };
}
