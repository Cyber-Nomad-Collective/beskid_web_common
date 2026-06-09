"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { NavTreeNode } from "./types.js";
import { cn } from "../lib/utils.js";

export interface SpecNavRailProps {
	navTree: NavTreeNode[];
	activeSlug?: string;
	className?: string;
	onNavigate?: (href: string) => void;
}

function NavBranch({
	node,
	activeSlug,
	depth,
	onNavigate,
}: {
	node: NavTreeNode;
	activeSlug?: string;
	depth: number;
	onNavigate?: (href: string) => void;
}) {
	const isActive = node.slug === activeSlug;
	const hasChildren = (node.children?.length ?? 0) > 0;
	const [open, setOpen] = useState(
		isActive || node.children?.some((c) => c.slug === activeSlug) || depth < 2,
	);

	return (
		<li>
			<div className="flex items-center gap-1">
				{hasChildren ? (
					<button
						type="button"
						className="rounded p-0.5 text-muted-foreground hover:bg-muted"
						onClick={() => setOpen((v) => !v)}
						aria-expanded={open}
					>
						{open ? (
							<ChevronDown className="size-4" />
						) : (
							<ChevronRight className="size-4" />
						)}
					</button>
				) : (
					<span className="inline-block w-5" />
				)}
				<a
					href={node.href}
					className={cn(
						"block flex-1 truncate rounded px-2 py-1 text-sm transition-colors",
						isActive
							? "bg-primary/10 font-medium text-primary"
							: "text-muted-foreground hover:bg-muted hover:text-foreground",
					)}
					onClick={(e) => {
						if (onNavigate) {
							e.preventDefault();
							onNavigate(node.href);
						}
					}}
				>
					{node.title}
				</a>
			</div>
			{hasChildren && open ? (
				<ul className="ml-4 border-l border-border/50 pl-1">
					{node.children!.map((child) => (
						<NavBranch
							key={child.slug}
							node={child}
							activeSlug={activeSlug}
							depth={depth + 1}
							onNavigate={onNavigate}
						/>
					))}
				</ul>
			) : null}
		</li>
	);
}

export function SpecNavRail({
	navTree,
	activeSlug,
	className,
	onNavigate,
}: SpecNavRailProps) {
	return (
		<nav className={cn("spec-nav-rail", className)} aria-label="Platform spec">
			<ul className="space-y-1">
				{navTree.map((node) => (
					<NavBranch
						key={node.slug}
						node={node}
						activeSlug={activeSlug}
						depth={0}
						onNavigate={onNavigate}
					/>
				))}
			</ul>
		</nav>
	);
}
