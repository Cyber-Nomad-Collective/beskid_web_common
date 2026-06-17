"use client";

import { useState, type ReactNode } from "react";
import { RelatedTopics } from "./related-topics.js";
import { cn } from "../lib/utils.js";

export interface SpecReaderShellProps {
	children: ReactNode;
	relatedTopics?: { href: string; title: string }[];
	adrs?: { href: string; title: string }[];
	articleCount?: number;
	adrCount?: number;
	showArticlesTab?: boolean;
	showAdrsTab?: boolean;
	architecture?: ReactNode;
	defaultTab?: "document" | "articles" | "adrs" | "architecture";
}

export function SpecReaderShell({
	children,
	relatedTopics = [],
	adrs = [],
	articleCount = 0,
	adrCount = 0,
	showArticlesTab = true,
	showAdrsTab = true,
	architecture,
	defaultTab = "document",
}: SpecReaderShellProps) {
	const [tab, setTab] = useState(defaultTab);
	const tabs: { id: typeof tab; label: string; show: boolean }[] = [
		{ id: "document", label: "Current document", show: true },
		{ id: "adrs", label: `ADRs${adrCount ? ` (${adrCount})` : ""}`, show: showAdrsTab },
		{
			id: "articles",
			label: `Articles${articleCount ? ` (${articleCount})` : ""}`,
			show: showArticlesTab,
		},
		{
			id: "architecture",
			label: "Architecture",
			show: Boolean(architecture),
		},
	];

	return (
		<div className="spec-reader-shell space-y-6">
			<div className="flex flex-wrap gap-2 border-b border-border/70 pb-2">
				{tabs
					.filter((t) => t.show)
					.map((t) => (
						<button
							key={t.id}
							type="button"
							className={cn(
								"rounded-md px-3 py-1.5 text-sm font-medium",
								tab === t.id
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted",
							)}
							onClick={() => setTab(t.id)}
						>
							{t.label}
						</button>
					))}
			</div>
			{tab === "document" ? (
				<div className="space-y-6">
					{children}
					<RelatedTopics topics={relatedTopics} />
				</div>
			) : null}
			{tab === "adrs" && showAdrsTab ? (
				adrs.length > 0 ? (
					<ul className="space-y-1 text-sm">
						{adrs.map((adr) => (
							<li key={adr.href}>
								<a href={adr.href} className="text-primary underline">
									{adr.title}
								</a>
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-muted-foreground">No ADRs found under this node.</p>
				)
			) : null}
			{tab === "articles" && showArticlesTab ? (
				<p className="text-sm text-muted-foreground">
					{articleCount} direct articles under this node.
				</p>
			) : null}
			{tab === "architecture" && architecture ? architecture : null}
		</div>
	);
}
