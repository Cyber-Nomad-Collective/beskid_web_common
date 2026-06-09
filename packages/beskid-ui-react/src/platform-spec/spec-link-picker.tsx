"use client";

import { useMemo, useState } from "react";
import { Input } from "../components/ui/input.js";
import type { NavTreeNode } from "./types.js";

function flattenNav(nodes: NavTreeNode[]): NavTreeNode[] {
	const out: NavTreeNode[] = [];
	for (const node of nodes) {
		out.push(node);
		if (node.children?.length) out.push(...flattenNav(node.children));
	}
	return out;
}

export interface SpecLinkPickerProps {
	navTree: NavTreeNode[];
	value?: string | null;
	onSelect: (node: NavTreeNode) => void;
	placeholder?: string;
}

export function SpecLinkPicker({
	navTree,
	value,
	onSelect,
	placeholder = "Search platform spec…",
}: SpecLinkPickerProps) {
	const [query, setQuery] = useState("");
	const flat = useMemo(() => flattenNav(navTree), [navTree]);
	const selected = flat.find((n) => n.slug === value);

	const results = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return flat.slice(0, 12);
		return flat
			.filter(
				(n) =>
					n.title.toLowerCase().includes(q) ||
					n.slug.toLowerCase().includes(q),
			)
			.slice(0, 12);
	}, [flat, query]);

	return (
		<div className="space-y-2">
			<Input
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder={placeholder}
			/>
			{selected ? (
				<p className="text-xs text-muted-foreground">
					Selected: {selected.title} ({selected.slug})
				</p>
			) : null}
			<ul className="max-h-48 overflow-auto rounded-md border border-border/70">
				{results.map((node) => (
					<li key={node.slug}>
						<button
							type="button"
							className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
							onClick={() => onSelect(node)}
						>
							<span className="font-medium">{node.title}</span>
							<span className="text-xs text-muted-foreground">{node.slug}</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}
