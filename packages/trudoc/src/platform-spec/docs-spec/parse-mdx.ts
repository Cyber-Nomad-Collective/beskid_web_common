import { parse as parseYaml } from 'yaml';

export function splitMdxFrontmatter(raw: string): {
	frontmatter: Record<string, unknown>;
	body: string;
} {
	if (!raw.startsWith('---')) {
		return { frontmatter: {}, body: raw };
	}
	const end = raw.indexOf('\n---', 3);
	if (end === -1) {
		return { frontmatter: {}, body: raw };
	}
	const yaml = raw.slice(3, end).trim();
	let frontmatter: Record<string, unknown> = {};
	try {
		const parsed = parseYaml(yaml) as unknown;
		if (parsed && typeof parsed === 'object') {
			frontmatter = parsed as Record<string, unknown>;
		}
	} catch {
		frontmatter = {};
	}
	return { frontmatter, body: raw.slice(end + 4) };
}
