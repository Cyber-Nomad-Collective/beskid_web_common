import type { SpecLevel } from './types';

/** Minimal frontmatter ↔ form field mapping shared by tracker and platform-spec app. */
export function formValuesToFrontmatter(
	specLevel: SpecLevel,
	values: Record<string, string>,
): Record<string, unknown> {
	const fm: Record<string, unknown> = {
		title: values.title?.trim(),
		description: values.description?.trim(),
		specLevel,
		owner: {
			name: values.owner_name?.trim(),
			email: values.owner_email?.trim(),
		},
		submitter: {
			name: values.submitter_name?.trim(),
			email: values.submitter_email?.trim(),
		},
	};

	if (
		specLevel === 'feature' ||
		specLevel === 'article' ||
		specLevel === 'adr'
	) {
		fm.status = values.status?.trim() || 'Proposed';
	}

	if (specLevel === 'adr') {
		fm.adrId = values.adrId?.trim();
		fm.adrStatus = values.adrStatus?.trim() || 'Proposed';
		if (values.adrDate?.trim()) fm.adrDate = values.adrDate.trim();
	}

	if (values.related_topics?.trim()) {
		try {
			const topics = JSON.parse(values.related_topics) as unknown;
			if (Array.isArray(topics)) fm.relatedTopics = topics;
		} catch {
			// ignore invalid JSON
		}
	}

	return fm;
}

export function frontmatterToFormValues(
	frontmatter: Record<string, unknown>,
	bodyMd: string,
): Record<string, string> {
	const owner = frontmatter.owner as
		| { name?: string; email?: string }
		| undefined;
	const submitter = frontmatter.submitter as
		| { name?: string; email?: string }
		| undefined;

	return {
		title: String(frontmatter.title ?? ''),
		description: String(frontmatter.description ?? ''),
		status: String(frontmatter.status ?? 'Proposed'),
		adrId: String(frontmatter.adrId ?? ''),
		adrStatus: String(frontmatter.adrStatus ?? 'Proposed'),
		adrDate: String(frontmatter.adrDate ?? ''),
		owner_name: String(owner?.name ?? ''),
		owner_email: String(owner?.email ?? ''),
		submitter_name: String(submitter?.name ?? ''),
		submitter_email: String(submitter?.email ?? ''),
		related_topics: frontmatter.relatedTopics
			? JSON.stringify(frontmatter.relatedTopics, null, 2)
			: '[]',
		body_md: bodyMd,
	};
}
