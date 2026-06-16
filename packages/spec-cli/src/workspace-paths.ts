import fs from "node:fs";
import path from "node:path";

const SPEC_CONTENT_REL = path.join("site", "spec-content");
const LEGACY_NORMATIVE_REL = "beskid_normative_spec";

/** Walk up from `start` to find a directory containing `.git`. */
export function findRepoRoot(start = process.cwd()): string | null {
	let dir = path.resolve(start);
	for (;;) {
		if (fs.existsSync(path.join(dir, ".git"))) return dir;
		const parent = path.dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

function isWorkspaceDir(dir: string): boolean {
	return (
		fs.existsSync(dir) &&
		(fs.existsSync(path.join(dir, "spec.json")) ||
			fs.existsSync(path.join(dir, "platform-spec")))
	);
}

/**
 * Default normative JSON workspace for the current checkout.
 * Prefers `site/spec-content`, then legacy `beskid_normative_spec`, then cwd.
 */
export function defaultNormativeWorkspaceDir(cwd = process.cwd()): string {
	const fromEnv = process.env.SPEC_WORKSPACE_DIR?.trim();
	if (fromEnv) return path.resolve(fromEnv);

	const root = findRepoRoot(cwd);
	if (root) {
		const siteContent = path.join(root, SPEC_CONTENT_REL);
		if (isWorkspaceDir(siteContent)) return siteContent;

		const legacy = path.join(root, LEGACY_NORMATIVE_REL);
		if (isWorkspaceDir(legacy)) return legacy;
	}

	return path.resolve(cwd);
}

/** Superrepo path to the canonical normative spec submodule. */
export function siteSpecContentPath(repoRoot: string): string {
	return path.join(repoRoot, SPEC_CONTENT_REL);
}

export function siteSpecContentReady(repoRoot: string): boolean {
	return isWorkspaceDir(siteSpecContentPath(repoRoot));
}
