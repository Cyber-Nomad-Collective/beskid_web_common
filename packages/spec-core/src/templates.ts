import fs from "node:fs";
import path from "node:path";
import { SPEC_TEMPLATES_DIR } from "./constants.js";
import {
	layoutFileWithGrid,
	parseLayoutFile,
	type LayoutFile,
} from "./grid-layout.js";

export function templatesDir(workspaceDir: string): string {
	return path.join(workspaceDir, SPEC_TEMPLATES_DIR);
}

export function listLayoutTemplates(workspaceDir: string): string[] {
	const dir = templatesDir(workspaceDir);
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith(".layout.json"))
		.map((f) => f.replace(/\.layout\.json$/, ""));
}

export function saveLayoutTemplate(
	workspaceDir: string,
	name: string,
	layout: LayoutFile,
): string {
	const dir = templatesDir(workspaceDir);
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, `${name}.layout.json`);
	fs.writeFileSync(file, `${JSON.stringify(layoutFileWithGrid(layout), null, 2)}\n`);
	return file;
}

export function loadLayoutTemplate(
	workspaceDir: string,
	name: string,
): LayoutFile {
	const file = path.join(templatesDir(workspaceDir), `${name}.layout.json`);
	if (!fs.existsSync(file)) {
		throw new Error(`Layout template not found: ${name}`);
	}
	return parseLayoutFile(JSON.parse(fs.readFileSync(file, "utf8")), file);
}

export function applyLayoutTemplate(
	workspaceDir: string,
	name: string,
	targetLayoutPath: string,
): LayoutFile {
	const template = loadLayoutTemplate(workspaceDir, name);
	fs.mkdirSync(path.dirname(targetLayoutPath), { recursive: true });
	fs.writeFileSync(
		targetLayoutPath,
		`${JSON.stringify(template, null, 2)}\n`,
	);
	return template;
}
