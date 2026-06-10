"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/utils.js";
import { SpecNavRail } from "./spec-nav-rail.js";
import type { NavTreeNode } from "./types.js";

function normalizeNavTree(navTree: NavTreeNode | NavTreeNode[]): NavTreeNode[] {
	return Array.isArray(navTree) ? navTree : [navTree];
}

export interface PlatformSpecShellProps {
	navTree: NavTreeNode | NavTreeNode[];
	activeSlug?: string;
	onNavigate?: (href: string) => void;
	className?: string;
	children: ReactNode;
}

export function PlatformSpecShell({
	navTree,
	activeSlug,
	onNavigate,
	className,
	children,
}: PlatformSpecShellProps) {
	const items = normalizeNavTree(navTree);
	const railTree =
		items.length === 1 && items[0]?.slug === "platform-spec"
			? (items[0].children ?? items)
			: items;

	return (
		<div className={cn("spec-shell flex min-h-0 flex-1", className)}>
			<aside className="hidden w-72 shrink-0 border-r border-border/80 lg:block">
				<SpecNavRail
					navTree={railTree}
					activeSlug={activeSlug}
					onNavigate={onNavigate}
					className="h-full overflow-y-auto px-3 py-4"
				/>
			</aside>
			<main className="min-w-0 flex-1">{children}</main>
		</div>
	);
}
