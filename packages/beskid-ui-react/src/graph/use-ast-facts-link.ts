"use client";

import { useCallback, useMemo, useState } from "react";

import { factIdsForAstNode, findAstNode } from "./layout-ast.js";
import type { AstGraphModel, AstGraphNode, FactsDagNode } from "./types.js";

export type AstFactsLinkState = {
	selectedAstNodeId: string | null;
	selectedAstNode: AstGraphNode | null;
	highlightedFactIds: string[];
	selectedFactIds: string[];
	selectAstNode: (nodeId: string | null, factIds?: string[]) => void;
	selectAstNodeModel: (node: AstGraphNode | null) => void;
	selectFact: (node: FactsDagNode | null) => void;
	clearSelection: () => void;
};

/**
 * Wire AstTreeView → FactsDagView highlighting.
 * AST click sets `highlightedFactIds` from the node's `factIds`.
 */
export function useAstFactsLink(model: AstGraphModel): AstFactsLinkState {
	const [selectedAstNodeId, setSelectedAstNodeId] = useState<string | null>(
		null,
	);
	const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);

	const selectedAstNode = useMemo(
		() => findAstNode(model, selectedAstNodeId),
		[model, selectedAstNodeId],
	);

	const highlightedFactIds = useMemo(
		() => factIdsForAstNode(model, selectedAstNodeId),
		[model, selectedAstNodeId],
	);

	const selectAstNode = useCallback(
		(nodeId: string | null, factIds?: string[]) => {
			setSelectedAstNodeId(nodeId);
			if (factIds) {
				setSelectedFactIds(factIds);
				return;
			}
			setSelectedFactIds(factIdsForAstNode(model, nodeId));
		},
		[model],
	);

	const selectAstNodeModel = useCallback((node: AstGraphNode | null) => {
		setSelectedAstNodeId(node?.id ?? null);
		setSelectedFactIds(node?.factIds ?? []);
	}, []);

	const selectFact = useCallback((node: FactsDagNode | null) => {
		setSelectedFactIds(node ? [node.id] : []);
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedAstNodeId(null);
		setSelectedFactIds([]);
	}, []);

	return {
		selectedAstNodeId,
		selectedAstNode,
		highlightedFactIds,
		selectedFactIds,
		selectAstNode,
		selectAstNodeModel,
		selectFact,
		clearSelection,
	};
}
