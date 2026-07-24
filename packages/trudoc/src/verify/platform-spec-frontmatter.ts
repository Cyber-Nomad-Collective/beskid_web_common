import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { platformSpecNodeSchema } from "../schema/content";

type PathLevel =
	| "domain-root"
	| "domain"
	| "area"
	| "feature"
	| "article"
	| "adr"
	| "legacy-or-bridge";

function walk(dir: string, out: string[] = []): string[] {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, name.name);
		if (name.isDirectory()) walk(p, out);
		else if (/\.(md|mdx)$/i.test(name.name)) out.push(p);
	}
	return out;
}

function loadFrontmatter(filePath: string): Record<string, unknown> {
	const raw = fs.readFileSync(filePath, "utf8");
	if (!raw.startsWith("---")) return {};
	const end = raw.indexOf("\n---", 3);
	if (end === -1) return {};
	const yaml = raw.slice(3, end).trim();
	return (parseYaml(yaml) as Record<string, unknown> | null) ?? {};
}

function classifyPath(filePath: string): PathLevel | null {
	const normalized = filePath.split(path.sep).join("/");
	const marker = "/src/content/docs/platform-spec/";
	const index = normalized.indexOf(marker);
	if (index === -1) return null;
	const relative = normalized
		.slice(index + marker.length)
		.replace(/\.(md|mdx)$/i, "");
	const segments = relative.split("/").filter(Boolean);
	const isIndex = segments.at(-1) === "index";

	if (segments.length === 1 && isIndex) return "domain-root";
	if (segments.length === 2 && isIndex) return "domain";
	if (segments.length === 3 && isIndex) return "area";
	if (segments.length === 4 && isIndex) return "feature";
	if (segments.length >= 5 && segments.at(-2) === "adr" && !isIndex)
		return "adr";
	if (segments.length === 3 && !isIndex) return "article";
	if (segments.length >= 4 && !isIndex && segments.at(-2) !== "adr")
		return "article";
	return "legacy-or-bridge";
}

function requireLayoutJson(
	websiteRoot: string,
	filePath: string,
	pathLevel: PathLevel,
): string[] {
	const errs: string[] = [];
	const layoutDir = path.dirname(filePath);
	const layoutJson = path.join(layoutDir, "layout.json");
	const needsLayout =
		pathLevel === "domain-root" ||
		pathLevel === "domain" ||
		pathLevel === "area" ||
		pathLevel === "feature";
	if (needsLayout && !fs.existsSync(layoutJson)) {
		errs.push(
			`PSF009 missing layout.json beside hub: ${path.relative(websiteRoot, layoutJson).replace(/\\/g, "/")}`,
		);
	}
	return errs;
}

function validatePathLevel(
	pathLevel: PathLevel,
	frontmatter: Record<string, unknown>,
): string[] {
	const errs: string[] = [];
	const level = frontmatter.specLevel;

	if (
		!["domain", "area", "component", "feature", "article", "adr"].includes(
			String(level),
		)
	) {
		errs.push(
			"PSF001 specLevel must be one of: domain | area | component | feature | article | adr",
		);
		return errs;
	}

	if (pathLevel === "domain" && level !== "domain") {
		errs.push(
			"PSF002 specLevel/path mismatch: expected domain for platform-spec/<domain>/index.mdx",
		);
	}
	if (pathLevel === "area" && level !== "area") {
		errs.push(
			"PSF003 specLevel/path mismatch: expected area for platform-spec/<domain>/<area>/index.mdx",
		);
	}
	if (pathLevel === "feature" && level !== "feature") {
		errs.push(
			"PSF004 specLevel/path mismatch: expected feature for platform-spec/<domain>/<area>/<feature>/index.mdx",
		);
	}
	if (pathLevel === "article" && level !== "article") {
		errs.push(
			"PSF005 specLevel/path mismatch: expected article for platform-spec area or feature child *.mdx (non-index)",
		);
	}
	if (pathLevel === "adr" && level !== "adr") {
		errs.push(
			"PSF006 specLevel/path mismatch: expected adr for platform-spec/<domain>/<area>/<feature>/adr/<name>.mdx",
		);
	}

	return errs;
}

function validateNodeSchema(frontmatter: Record<string, unknown>): string[] {
	const level = frontmatter.specLevel;
	if (
		level !== "domain" &&
		level !== "area" &&
		level !== "feature" &&
		level !== "article" &&
		level !== "adr"
	) {
		return [];
	}
	const parsed = platformSpecNodeSchema.safeParse(frontmatter);
	if (parsed.success) return [];
	return parsed.error.issues.map((issue) => {
		const pathHint = issue.path.join(".") || "frontmatter";
		return `PSF010 ${pathHint}: ${issue.message}`;
	});
}

export type PlatformSpecFrontmatterIssue = {
	code: string;
	severity: "error" | "warn";
	file: string;
	message: string;
};

function parseIssueLine(line: string): { code: string; message: string } {
	const match = line.match(/^(PSF\d{3})\s+(.*)$/);
	if (match) return { code: match[1], message: match[2] };
	return { code: "PSF000", message: line };
}

function normalizeSpecRel(rel: string): string {
	return rel.replace(/\\/g, "/").replace(/^\//, "");
}

/** Collect frontmatter/layout issues for platform-spec files (optional path filter). */
export function collectPlatformSpecFrontmatterIssues(
	websiteRoot: string,
	filterRelPaths?: Iterable<string>,
): PlatformSpecFrontmatterIssue[] {
	const root = path.join(websiteRoot, "src", "content", "docs", "platform-spec");
	const filter = filterRelPaths
		? new Set([...filterRelPaths].map(normalizeSpecRel))
		: null;
	const files = walk(root);
	const issues: PlatformSpecFrontmatterIssue[] = [];

	for (const file of files) {
		const specRel = normalizeSpecRel(path.relative(root, file));
		if (filter && !filter.has(specRel)) continue;

		const pathLevel = classifyPath(file);
		if (!pathLevel) continue;

		let frontmatter: Record<string, unknown>;
		try {
			frontmatter = loadFrontmatter(file);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			issues.push({
				code: "PSF011",
				severity: "error",
				file: specRel,
				message: `invalid YAML frontmatter: ${msg}`,
			});
			continue;
		}

		for (const line of [
			...validatePathLevel(pathLevel, frontmatter),
			...validateNodeSchema(frontmatter),
			...requireLayoutJson(websiteRoot, file, pathLevel),
		]) {
			const parsed = parseIssueLine(line);
			issues.push({
				code: parsed.code,
				severity: "error",
				file: specRel,
				message: parsed.message,
			});
		}
	}

	return issues;
}

export function verifyPlatformSpecFrontmatter(websiteRoot: string): void {
	const issues = collectPlatformSpecFrontmatterIssues(websiteRoot);
	if (issues.length) {
		const grouped = new Map<string, PlatformSpecFrontmatterIssue[]>();
		for (const issue of issues) {
			const list = grouped.get(issue.file) ?? [];
			list.push(issue);
			grouped.set(issue.file, list);
		}
		for (const [file, fileIssues] of [...grouped.entries()].sort(([a], [b]) =>
			a.localeCompare(b),
		)) {
			console.error(`\n[platform-spec] src/content/docs/platform-spec/${file}:`);
			for (const issue of fileIssues) {
				console.error(`  - ${issue.code}: ${issue.message}`);
			}
		}
		console.error("\nplatform-spec frontmatter verification failed.");
		process.exit(1);
	}
	const root = path.join(websiteRoot, "src", "content", "docs", "platform-spec");
	const fileCount = walk(root).length;
	if (fileCount) {
		console.log(`platform-spec: verified ${fileCount} file(s).`);
	}
}

export const platformSpecFrontmatterIssueSchema = z.object({
	code: z.string(),
	message: z.string(),
	path: z.string().optional(),
});
