import { classifyPlatformSpecRel } from '../../layout/scan';

export type PathClass =
	| 'domain-root'
	| 'domain'
	| 'area'
	| 'feature'
	| 'article'
	| 'adr'
	| 'legacy-or-bridge'
	| 'component';

const SPEC_MARKER = 'src/content/docs/platform-spec/';

export function pathClassFromRepoPath(repoPath: string): PathClass {
	const idx = repoPath.indexOf(SPEC_MARKER);
	if (idx === -1) return 'legacy-or-bridge';
	const rel = repoPath.slice(idx + SPEC_MARKER.length).replace(/\.(md|mdx)$/i, '');
	return classifyPlatformSpecRel(rel);
}

export function specRelFromRepoPath(repoPath: string): string {
	const idx = repoPath.indexOf(SPEC_MARKER);
	if (idx === -1) return repoPath;
	return repoPath.slice(idx + SPEC_MARKER.length);
}

export function repoPathFromSpecRel(
	rel: string,
	ext: 'mdx' | 'md' = 'mdx',
): string {
	const normalized = rel.replace(/\\/g, '/').replace(/^\//, '');
	return `site/website/src/content/docs/platform-spec/${normalized}${normalized.endsWith(`.${ext}`) ? '' : `.${ext}`}`;
}

export function slugFromRepoPath(repoPath: string): string {
	const rel = specRelFromRepoPath(repoPath);
	return `platform-spec/${rel.replace(/\.(md|mdx)$/i, '').replace(/\/index$/, '')}`;
}

export function parentSlugFromPath(slug: string, pathClass: PathClass): string | null {
	if (slug === 'platform-spec') return null;
	const parts = slug.split('/').filter(Boolean);
	if (pathClass === 'domain' || pathClass === 'domain-root') return 'platform-spec';
	if (pathClass === 'area') return parts.slice(0, 2).join('/');
	if (pathClass === 'feature') return parts.slice(0, 3).join('/');
	if (pathClass === 'article' || pathClass === 'adr') {
		return parts.slice(0, -1).join('/');
	}
	return parts.slice(0, -1).join('/') || 'platform-spec';
}

export function validateSpecLevelPath(
	specLevel: string,
	repoPath: string,
): string | null {
	const pathClass = pathClassFromRepoPath(repoPath);
	const expected: Record<string, PathClass> = {
		domain: 'domain',
		area: 'area',
		feature: 'feature',
		article: 'article',
		adr: 'adr',
	};
	const want = expected[specLevel];
	if (!want) return `Unknown specLevel: ${specLevel}`;
	if (
		pathClass !== want &&
		!(specLevel === 'domain' && pathClass === 'domain-root')
	) {
		return `Path class ${pathClass} does not match specLevel ${specLevel} for ${repoPath}`;
	}
	return null;
}
