export interface DocsNavigationLink {
	label: string;
	link: string;
}

export interface DocsNavigationGroup {
	label: string;
	items: DocsNavigationItem[];
}

export type DocsNavigationItem = DocsNavigationLink | DocsNavigationGroup;
