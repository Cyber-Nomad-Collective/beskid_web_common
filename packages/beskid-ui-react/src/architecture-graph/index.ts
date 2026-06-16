import type {
	ArchitectureComponent,
	ArchitectureComponentKind,
	ArchitectureGraphGroup,
	ArchitectureGraphV2,
	ArchitectureLink,
	ArchitectureRelation,
	AstSyntaxFamily,
	CompilerPipelinePhase,
	DependencySource,
	SpecLevel,
	SyntaxKindByFamily,
} from "@cyber-nomad-collective/spec-core";
import type {
	ArchitectureRelationKind,
	ArchitectureLinkKind,
} from "@cyber-nomad-collective/spec-core";

// Re-exported types for consumers.
export type {
	ArchitectureComponent,
	ArchitectureComponentKind,
	ArchitectureGraphGroup,
	ArchitectureGraphV2,
	ArchitectureLink,
	ArchitectureRelation,
	ArchitectureRelationKind,
	AstSyntaxFamily,
	CompilerPipelinePhase,
	DependencySource,
	SyntaxKindByFamily,
};

export function defineArchitectureComponent<
	K extends ArchitectureComponentKind,
	Props extends Record<string, unknown>,
>(definition: {
	kind: K;
	props: Props;
}) {
	// This is intentionally a lightweight "registration" API. Rendering/detection
	// will be attached to these definitions in later phases.
	return definition;
}

export function defineArchitectureRelation<
	K extends ArchitectureRelationKind,
	Props extends Record<string, unknown>,
>(definition: {
	kind: K;
	props: Props;
}) {
	return definition;
}

export function defineArchitectureLink<
	K extends ArchitectureLinkKind,
	Props extends Record<string, unknown>,
>(definition: {
	kind: K;
	props: Props;
}) {
	return definition;
}

type GroupInput =
	| ArchitectureGraphGroup
	| {
			id: string;
			label: string;
			color?: string;
			description?: string;
	  };

type GroupsInput =
	| ArchitectureGraphGroup[]
	| Record<string, string>
	| Record<string, { label: string; color?: string; description?: string }>;

function normalizeGroups(groups: GroupsInput | undefined): ArchitectureGraphGroup[] | undefined {
	if (!groups) return undefined;
	if (Array.isArray(groups)) return groups;
	if (typeof groups === "object") {
		const out: ArchitectureGraphGroup[] = [];
		for (const [id, value] of Object.entries(groups)) {
			if (typeof value === "string") {
				out.push({ id, label: value });
			} else {
				out.push({ id, label: value.label, color: value.color, description: value.description });
			}
		}
		return out;
	}
	return undefined;
}

export type ArchitectureGraphBuilderInit = {
	title?: string;
	description?: string;
	groups?: GroupsInput;
};

export class ArchitectureGraphBuilder {
	private nodes: ArchitectureComponent[] = [];
	private edges: ArchitectureRelation[] = [];
	private readonly groups: ArchitectureGraphV2["groups"] | undefined;
	private readonly title: string | undefined;
	private readonly description: string | undefined;

	constructor(init: ArchitectureGraphBuilderInit) {
		this.title = init.title;
		this.description = init.description;
		this.groups = normalizeGroups(init.groups) ?? undefined;
	}

	node(node: ArchitectureComponent): this {
		this.nodes.push(node);
		return this;
	}

	edge(edge: ArchitectureRelation): this {
		this.edges.push(edge);
		return this;
	}

	build(): ArchitectureGraphV2 {
		return {
			version: 2,
			title: this.title,
			description: this.description,
			groups: this.groups,
			nodes: this.nodes,
			edges: this.edges,
		};
	}
}

export function graph(init: ArchitectureGraphBuilderInit): ArchitectureGraphBuilder {
	return new ArchitectureGraphBuilder(init);
}

// -----------------------------
// Typed node constructors
// -----------------------------

type NodeMeta = {
	label?: string;
	group?: string;
	description?: string;
	href?: string;
	hidden?: boolean;
	links?: ArchitectureLink[];
};

export const links = {
	specNode(slug: string): ArchitectureLink {
		return { kind: "specNode", slug };
	},
	deployUrl(url: string, label?: string): ArchitectureLink {
		return { kind: "deployUrl", url, label };
	},
	githubRepo(owner: string, repo: string, path?: string): ArchitectureLink {
		return { kind: "githubRepo", owner, repo, path };
	},
	cratePath(crate: string, path?: string): ArchitectureLink {
		return { kind: "cratePath", crate, path };
	},
	workspaceRoot(path: string): ArchitectureLink {
		return { kind: "workspaceRoot", path };
	},
	rustModule(crate: string, modulePath: string): ArchitectureLink {
		return { kind: "rustModule", crate, modulePath };
	},
} as const;

export const components = {
	service(id: string, input: NodeMeta & {
		name: string;
		host: string;
		port?: number;
		stack?: string;
		deployEnv?: "production" | "staging" | "local";
	}): ArchitectureComponent {
		return {
			id,
			kind: "service",
			label: input.label ?? id,
			group: input.group,
			description: input.description,
			href: input.href,
			hidden: input.hidden,
			links: input.links,
			props: {
				name: input.name,
				host: input.host,
				port: input.port,
				stack: input.stack,
				deployEnv: input.deployEnv,
			},
		};
	},

	dependency(id: string, input: NodeMeta & {
		crate: string;
		purpose: string;
		source: DependencySource;
		vendored?: boolean;
	}): ArchitectureComponent {
		return {
			id,
			kind: "dependency",
			label: input.label ?? id,
			group: input.group,
			description: input.description,
			href: input.href,
			hidden: input.hidden,
			links: input.links,
			props: {
				crate: input.crate,
				purpose: input.purpose,
				source: input.source,
				vendored: input.vendored,
			},
		};
	},

	compilerPipelineStage(id: string, input: NodeMeta & {
		crate: string;
		entry: string;
		phase: CompilerPipelinePhase;
	}): ArchitectureComponent {
		return {
			id,
			kind: "compilerPipelineStage",
			label: input.label ?? id,
			group: input.group,
			description: input.description,
			href: input.href,
			hidden: input.hidden,
			links: input.links,
			props: {
				crate: input.crate,
				entry: input.entry,
				phase: input.phase,
			},
		};
	},

	rustModule(id: string, input: NodeMeta & {
		crate: string;
		modulePath: string;
		visibility?: "pub" | "pub(crate)" | "private";
	}): ArchitectureComponent {
		return {
			id,
			kind: "rustModule",
			label: input.label ?? id,
			group: input.group,
			description: input.description,
			href: input.href,
			hidden: input.hidden,
			links: input.links,
			props: {
				crate: input.crate,
				modulePath: input.modulePath,
				visibility: input.visibility,
			},
		};
	},

	beskidProject(id: string, input: NodeMeta & {
		manifestPath: string;
		targetKind?: string;
	}): ArchitectureComponent {
		return {
			id,
			kind: "beskidProject",
			label: input.label ?? id,
			group: input.group,
			description: input.description,
			href: input.href,
			hidden: input.hidden,
			links: input.links,
			props: {
				manifestPath: input.manifestPath,
				targetKind: input.targetKind,
			},
		};
	},

	beskidWorkspace(id: string, input: NodeMeta & {
		manifestPath: string;
		root?: string;
	}): ArchitectureComponent {
		return {
			id,
			kind: "beskidWorkspace",
			label: input.label ?? id,
			group: input.group,
			description: input.description,
			href: input.href,
			hidden: input.hidden,
			links: input.links,
			props: {
				manifestPath: input.manifestPath,
				root: input.root,
			},
		};
	},

	specNode(
		id: string,
		input: NodeMeta & { slug: string; specLevel?: SpecLevel },
	): ArchitectureComponent {
		return {
			id,
			kind: "specNode",
			label: input.label ?? id,
			group: input.group,
			description: input.description,
			href: input.href,
			hidden: input.hidden,
			links: input.links,
			props: {
				slug: input.slug,
				...(input.specLevel ? { specLevel: input.specLevel } : {}),
			},
		};
	},

	astSyntaxNode<F extends AstSyntaxFamily>(
		id: string,
		input: NodeMeta & {
			family: F;
			syntaxKind: SyntaxKindByFamily[F];
		},
	): ArchitectureComponent {
		return {
			id,
			kind: "astSyntaxNode",
			label: input.label ?? id,
			group: input.group,
			description: input.description,
			href: input.href,
			hidden: input.hidden,
			links: input.links,
			props: {
				family: input.family,
				syntaxKind: input.syntaxKind,
			},
		};
	},

	group(id: string, input: NodeMeta): ArchitectureComponent {
		return {
			id,
			kind: "group",
			label: input.label ?? id,
			group: input.group,
			description: input.description,
			href: input.href,
			hidden: input.hidden,
			links: input.links,
			props: {},
		};
	},
} as const;

export const relations = {
	feeds(
		from: string,
		to: string,
		input: { id?: string; label?: string; description?: string; hidden?: boolean; artifact?: string },
	): ArchitectureRelation {
		return {
			id: input.id,
			kind: "feeds",
			from,
			to,
			label: input.label,
			description: input.description,
			hidden: input.hidden,
			props: { artifact: input.artifact },
		} as ArchitectureRelation;
	},

	dependsOn(
		from: string,
		to: string,
		input: {
			id?: string;
			label?: string;
			description?: string;
			hidden?: boolean;
			version?: string;
			optional?: boolean;
		},
	): ArchitectureRelation {
		return {
			id: input.id,
			kind: "dependsOn",
			from,
			to,
			label: input.label,
			description: input.description,
			hidden: input.hidden,
			props: { version: input.version, optional: input.optional },
		} as ArchitectureRelation;
	},

	contains(
		from: string,
		to: string,
		input: { id?: string; label?: string; description?: string; hidden?: boolean; order?: number },
	): ArchitectureRelation {
		return {
			id: input.id,
			kind: "contains",
			from,
			to,
			label: input.label,
			description: input.description,
			hidden: input.hidden,
			props: { order: input.order },
		} as ArchitectureRelation;
	},

	lowersTo(
		from: string,
		to: string,
		input: { id?: string; label?: string; description?: string; hidden?: boolean; ir?: string },
	): ArchitectureRelation {
		return {
			id: input.id,
			kind: "lowersTo",
			from,
			to,
			label: input.label,
			description: input.description,
			hidden: input.hidden,
			props: { ir: input.ir },
		} as ArchitectureRelation;
	},

	calls(
		from: string,
		to: string,
		input: { id?: string; label?: string; description?: string; hidden?: boolean; protocol?: string },
	): ArchitectureRelation {
		return {
			id: input.id,
			kind: "calls",
			from,
			to,
			label: input.label,
			description: input.description,
			hidden: input.hidden,
			props: { protocol: input.protocol },
		} as ArchitectureRelation;
	},

	referencesSpec(
		from: string,
		to: string,
		input: { id?: string; label?: string; description?: string; hidden?: boolean; slug?: string },
	): ArchitectureRelation {
		return {
			id: input.id,
			kind: "referencesSpec",
			from,
			to,
			label: input.label,
			description: input.description,
			hidden: input.hidden,
			props: { slug: input.slug },
		} as ArchitectureRelation;
	},

	vendoredFrom(
		from: string,
		to: string,
		input: {
			id?: string;
			label?: string;
			description?: string;
			hidden?: boolean;
			sourceUrl?: string;
			revision?: string;
		},
	): ArchitectureRelation {
		return {
			id: input.id,
			kind: "vendoredFrom",
			from,
			to,
			label: input.label,
			description: input.description,
			hidden: input.hidden,
			props: { sourceUrl: input.sourceUrl, revision: input.revision },
		} as ArchitectureRelation;
	},

	implements(
		from: string,
		to: string,
		input: { id?: string; label?: string; description?: string; hidden?: boolean; contract?: string },
	): ArchitectureRelation {
		return {
			id: input.id,
			kind: "implements",
			from,
			to,
			label: input.label,
			description: input.description,
			hidden: input.hidden,
			props: { contract: input.contract },
		} as ArchitectureRelation;
	},

	relatesTo(
		from: string,
		to: string,
		input: { id?: string; label?: string; description?: string; hidden?: boolean; inferred?: boolean },
	): ArchitectureRelation {
		return {
			id: input.id,
			kind: "relatesTo",
			from,
			to,
			label: input.label,
			description: input.description,
			hidden: input.hidden,
			props: { inferred: input.inferred },
		} as ArchitectureRelation;
	},
} as const;

