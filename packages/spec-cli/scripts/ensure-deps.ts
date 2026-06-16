#!/usr/bin/env bun
/**
 * Bun nests trudoc's yaml symlink at ../../../node_modules/yaml — ensure that path resolves.
 */
import fs from "node:fs";
import path from "node:path";

function ensureYamlLink(packageRoot: string): void {
	const yamlPkg = path.join(packageRoot, "node_modules", "yaml");
	const nestedLink = path.join(
		packageRoot,
		"node_modules",
		"@cyber-nomad-collective",
		"trudoc",
		"node_modules",
		"yaml",
	);
	const nestedParent = path.dirname(nestedLink);
	const bridgeDir = path.join(packageRoot, "node_modules", "node_modules");
	const bridgeYaml = path.join(bridgeDir, "yaml");

	if (!fs.existsSync(yamlPkg) || !fs.existsSync(nestedParent)) return;

	fs.mkdirSync(bridgeDir, { recursive: true });
	fs.rmSync(bridgeYaml, { recursive: true, force: true });
	fs.symlinkSync(path.relative(bridgeDir, yamlPkg), bridgeYaml);

	if (fs.lstatSync(nestedLink).isSymbolicLink()) {
		fs.rmSync(nestedLink, { force: true });
		fs.cpSync(yamlPkg, nestedLink, { recursive: true });
	}
}

const specCoreRoot = path.resolve(import.meta.dirname, "../../spec-core");
const specCliRoot = path.resolve(import.meta.dirname, "..");

ensureYamlLink(specCoreRoot);
ensureYamlLink(path.join(specCliRoot, "node_modules/@cyber-nomad-collective/spec-core"));
