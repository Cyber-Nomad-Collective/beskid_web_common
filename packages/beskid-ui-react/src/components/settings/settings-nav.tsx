"use client";

import { useMemo } from "react";

import { cn } from "../../lib/utils.js";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "../ui/sidebar.js";
import { useSettings } from "./settings-provider.js";
import type { SettingsGroupDef, SettingsSectionDef } from "./types.js";

function normalizeSearch(value: string): string {
	return value.trim().toLowerCase();
}

function sectionMatchesQuery<TValues extends Record<string, unknown>>(
	section: SettingsSectionDef<TValues>,
	group: SettingsGroupDef<TValues>,
	query: string,
): boolean {
	if (!query) {
		return true;
	}

	const haystack = [
		group.label,
		section.title,
		section.description,
		...(section.keywords ?? []),
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	return haystack.includes(query);
}

export type SettingsNavProps = {
	className?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
};

export function SettingsNav({
	className,
	searchPlaceholder = "Search settings",
	emptyMessage = "No settings match your search.",
}: SettingsNavProps) {
	const {
		registry,
		activeSectionId,
		setActiveSectionId,
		searchQuery,
		setSearchQuery,
	} = useSettings();

	const normalizedQuery = normalizeSearch(searchQuery);

	const visibleGroups = useMemo(() => {
		return registry.groups
			.map((group) => ({
				group,
				sections: group.sections.filter((section) =>
					sectionMatchesQuery(section, group, normalizedQuery),
				),
			}))
			.filter((entry) => entry.sections.length > 0);
	}, [normalizedQuery, registry.groups]);

	return (
		<SidebarProvider defaultOpen className="min-h-0 w-full">
			<Sidebar
				className={cn(
					"relative h-full w-full border-r border-border bg-sidebar text-sidebar-foreground",
					className,
				)}
				collapsible="none"
				variant="sidebar"
			>
				<SidebarHeader className="border-b border-sidebar-border">
					<SidebarInput
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						placeholder={searchPlaceholder}
						aria-label={searchPlaceholder}
					/>
				</SidebarHeader>
				<SidebarContent>
					{visibleGroups.length === 0 ? (
						<p className="text-muted-foreground px-4 py-3 text-sm">{emptyMessage}</p>
					) : (
						visibleGroups.map(({ group, sections }) => {
							const Icon = group.icon;

							return (
								<SidebarGroup key={group.id}>
									<SidebarGroupLabel className="gap-2">
										{Icon ? <Icon className="size-4" /> : null}
										<span>{group.label}</span>
									</SidebarGroupLabel>
									<SidebarGroupContent>
										<SidebarMenu>
											{sections.map((section) => (
												<SidebarMenuItem key={section.id}>
													<SidebarMenuButton
														type="button"
														isActive={activeSectionId === section.id}
														onClick={() => setActiveSectionId(section.id)}
													>
														<span>{section.title}</span>
													</SidebarMenuButton>
												</SidebarMenuItem>
											))}
										</SidebarMenu>
									</SidebarGroupContent>
								</SidebarGroup>
							);
						})
					)}
				</SidebarContent>
			</Sidebar>
		</SidebarProvider>
	);
}
