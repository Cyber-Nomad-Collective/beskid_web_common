"use client";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { ReleaseInfo } from "./types";

interface ChangelogListProps {
	releases: ReleaseInfo[];
	loading: boolean;
}

export function ChangelogList({ releases, loading }: ChangelogListProps) {
	if (loading) {
		return (
			<div className="flex flex-col gap-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="animate-pulse flex flex-col gap-2">
						<div className="h-4 w-24 rounded bg-muted" />
						<div className="h-3 w-full rounded bg-muted/50" />
					</div>
				))}
			</div>
		);
	}

	if (releases.length === 0) {
		return <p className="text-sm text-muted-foreground">No releases yet.</p>;
	}

	return (
		<div className="flex flex-col gap-4">
			{releases.map((release) => (
				<div
					key={release.version}
					className="flex flex-col gap-1 border-l-2 border-muted pl-4"
				>
					<div className="flex items-center gap-2 flex-wrap">
						<Badge variant="default">{release.version}</Badge>
						<span className="text-xs text-muted-foreground">{release.date}</span>
						<span className="text-sm font-medium">{release.title}</span>
					</div>
					{release.changelog && (
						<p className="text-sm text-muted-foreground line-clamp-3">
							{release.changelog}
						</p>
					)}
					{release.links.length > 0 && (
						<div className="flex items-center gap-1">
							{release.links.map((link) => (
								<Button key={link.label} variant="link" size="xs" asChild>
									<a href={link.url} target="_blank" rel="noopener noreferrer">
										{link.label}
									</a>
								</Button>
							))}
						</div>
					)}
				</div>
			))}
		</div>
	);
}
