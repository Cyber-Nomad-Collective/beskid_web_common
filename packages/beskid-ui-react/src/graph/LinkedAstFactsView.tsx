"use client";

import { useState } from "react";

import type { OpenInEditorOptions } from "../explorer/open-in-editor.js";
import { cn } from "../lib/utils.js";
import { AstTreeView } from "./AstTreeView.js";
import { FactsDagView } from "./FactsDagView.js";
import type { AstGraphModel, FactsDagModel } from "./types.js";

export type LinkedAstFactsViewProps = {
	ast: AstGraphModel;
	facts: FactsDagModel;
	className?: string;
	openInEditor?: OpenInEditorOptions | false;
};

/** Side-by-side AST → facts linking panel for docs demos. */
export function LinkedAstFactsView({
	ast,
	facts,
	className,
	openInEditor,
}: LinkedAstFactsViewProps) {
	const [selectedAstId, setSelectedAstId] = useState<string | null>(null);
	const [highlightedFacts, setHighlightedFacts] = useState<string[]>([]);

	return (
		<div className={cn("grid gap-4 lg:grid-cols-2", className)}>
			<div className="space-y-2">
				<h3 className="text-sm font-medium">AST</h3>
				<AstTreeView
					model={ast}
					selectedNodeId={selectedAstId}
					highlightedFactIds={highlightedFacts}
					onNodeSelect={(id, factIds) => {
						setSelectedAstId(id);
						setHighlightedFacts(factIds);
					}}
				/>
			</div>
			<div className="space-y-2">
				<h3 className="text-sm font-medium">Facts DAG</h3>
				<FactsDagView
					model={facts}
					highlightedNodeIds={highlightedFacts}
					selectedNodeId={highlightedFacts[0] ?? null}
					openInEditor={openInEditor}
				/>
			</div>
		</div>
	);
}
