import fs from "node:fs";
import path from "node:path";
import {
	SPEC_MARKDOWN_FILE,
	SPEC_NODE_FILE,
} from "./constants.js";
import { writeNodeMarkdown } from "./markdown-content.js";
import { stripMdxPresentationSurface } from "./strip-mdx-surface.js";
import type { WorkspaceManifest } from "./workspace/schema.js";

export interface ScrubWorkspacePresentationResult {
	scrubbed: number;
	unchanged: number;
}

function collectNodeDirs(contentRoot: string): string[] {
	const out: string[] = [];
	if (!fs.existsSync(contentRoot)) return out;
	for (const entry of fs.readdirSync(contentRoot, { withFileTypes: true })) {
		const full = path.join(contentRoot, entry.name);
		if (!entry.isDirectory()) continue;
		if (fs.existsSync(path.join(full, SPEC_NODE_FILE))) {
			out.push(full);
		}
		out.push(...collectNodeDirs(full));
	}
	return out;
}

export function scrubWorkspacePresentation(
	workspaceDir: string,
	manifest: WorkspaceManifest,
): ScrubWorkspacePresentationResult {
	const contentRoot = path.join(workspaceDir, manifest.contentRoot);
	const result: ScrubWorkspacePresentationResult = { scrubbed: 0, unchanged: 0 };

	for (const nodeDir of collectNodeDirs(contentRoot)) {
		const markdownPath = path.join(nodeDir, SPEC_MARKDOWN_FILE);
		let changed = false;

		if (fs.existsSync(markdownPath)) {
			const raw = fs.readFileSync(markdownPath, "utf8");
			const scrubbed = stripMdxPresentationSurface(raw);
			if (scrubbed !== raw.trim()) {
				writeNodeMarkdown(nodeDir, scrubbed);
				changed = true;
			}
		}

		if (changed) result.scrubbed++;
		else result.unchanged++;
	}

	return result;
}
