import type { AuthAppId } from "./v1/types.js";

export const AUTH_HUB_ISSUER = "beskid-auth-hub";
export const AUTH_API_VERSION = "v1";
/** @deprecated use HUB_USER_TOKEN_TTL_SECONDS */
export const HANDOFF_TTL_SECONDS = 7 * 24 * 60 * 60;
export const HUB_USER_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const AUTH_APP_IDS = ["tracker", "nexus", "pckg"] as const;

export const AUTH_APP_META: Record<
	AuthAppId,
	{ label: string; description: string }
> = {
	tracker: {
		label: "Beskid Tracker",
		description: "Kanban and platform-spec docs on GitHub issues.",
	},
	nexus: {
		label: "Beskid Nexus",
		description: "Compiler graph explorer and catalog.",
	},
	pckg: {
		label: "pckg registry",
		description: "Package registry accounts and publishing.",
	},
};
