export const AUTH_HUB_ISSUER = "beskid-auth-hub";
export const AUTH_API_VERSION = "v1";
/** @deprecated use HUB_USER_TOKEN_TTL_SECONDS */
export const HANDOFF_TTL_SECONDS = 7 * 24 * 60 * 60;
export const HUB_USER_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const AUTH_APP_IDS = [
    "tracker",
    "nexus",
    "pckg",
    "learn",
];
export const AUTH_APP_META = {
    tracker: {
        label: "Beskid Tracker",
        description: "Kanban delivery tracking and issue management.",
    },
    nexus: {
        label: "Beskid Nexus",
        description: "Compiler graph explorer and catalog.",
    },
    pckg: {
        label: "pckg registry",
        description: "Package registry accounts and publishing.",
    },
    learn: {
        label: "Beskid Learn",
        description: "Authenticated interactive Beskid lessons and progress.",
    },
};
