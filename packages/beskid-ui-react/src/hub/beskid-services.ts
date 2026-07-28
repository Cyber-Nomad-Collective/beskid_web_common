import type { BeskidHubIcon } from "./icons";

export type BeskidServiceIcon = BeskidHubIcon;

export interface BeskidService {
	id: string;
	label: string;
	href: string;
	icon: BeskidServiceIcon;
}

/** Canonical Beskid hub tiles (square grid). */
export const BESKID_SERVICES: BeskidService[] = [
	{
		id: "home",
		label: "Home",
		href: "https://beskid-lang.org/",
		icon: "home",
	},
	{
		id: "platform-spec",
		label: "Specification",
		href: "https://spec.beskid-lang.org/platform-spec/",
		icon: "platform-spec",
	},
	{
		id: "book",
		label: "Book",
		href: "https://beskid-lang.org/book/",
		icon: "book",
	},
	{ id: "learn", label: "Learn", href: "https://learn.beskid-lang.org/", icon: "learn" },
	{
		id: "pckg",
		label: "pckg",
		href: "https://pckg.beskid-lang.org/",
		icon: "pckg",
	},
	{
		id: "tracker",
		label: "Tracker",
		href: "https://tracker.beskid-lang.org/",
		icon: "tracker",
	},
	{
		id: "nexus",
		label: "Nexus",
		href: "https://nexus.beskid-lang.org/",
		icon: "nexus",
	},
];
