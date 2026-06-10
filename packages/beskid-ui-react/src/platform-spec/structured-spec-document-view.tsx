"use client";

import type { LayoutFile } from "@cyber-nomad-collective/spec-core";
import type { ReactNode } from "react";

import { SpecCommentsPanel } from "./spec-comments-panel.js";
import { SpecOriginProvider } from "./origin-context.js";
import { SpecPageHeader } from "./spec-page-header.js";
import { SpecReaderShell } from "./spec-reader-shell.js";
import { SpecWidgetGrid } from "./spec-widget-grid.js";
import type { CatalogEntry, SpecCommentItem } from "./types.js";

export interface StructuredSpecDocumentViewProps {
	title: string;
	specLevel?: string | null;
	status?: string | null;
	description?: string | null;
	bodyHtml: string;
	layout?: LayoutFile | null;
	comments?: SpecCommentItem[];
	catalogEntries?: CatalogEntry[];
	relatedTopics?: { href: string; title: string }[];
	editAction?: ReactNode;
	className?: string;
}

export function StructuredSpecDocumentView({
	title,
	specLevel,
	status,
	description,
	bodyHtml,
	layout,
	comments = [],
	catalogEntries = [],
	relatedTopics = [],
	editAction,
	className,
}: StructuredSpecDocumentViewProps) {
	return (
		<SpecOriginProvider>
			<article
				className={[
					"spec-document-view mx-auto w-full max-w-5xl px-6 py-8",
					className,
				]
					.filter(Boolean)
					.join(" ")}
			>
				{editAction ? (
					<div className="mb-4 flex justify-end">{editAction}</div>
				) : null}
				<SpecReaderShell relatedTopics={relatedTopics}>
					<SpecPageHeader
						title={title}
						description={description}
						specLevel={specLevel}
						status={status}
					/>
					{layout ? (
						<SpecWidgetGrid
							layout={layout}
							catalogEntries={catalogEntries}
							className="mb-8"
						/>
					) : null}
					<div
						className="spec-prose prose prose-invert max-w-none"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: caller renders markdown
						dangerouslySetInnerHTML={{ __html: bodyHtml }}
					/>
					{comments.length > 0 ? (
						<SpecCommentsPanel comments={comments} onChange={() => {}} disabled />
					) : null}
				</SpecReaderShell>
			</article>
		</SpecOriginProvider>
	);
}
