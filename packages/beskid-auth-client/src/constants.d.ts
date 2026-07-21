import type { AuthAppId } from "./v1/types.js";
export declare const AUTH_HUB_ISSUER = "beskid-auth-hub";
export declare const AUTH_API_VERSION = "v1";
/** @deprecated use HUB_USER_TOKEN_TTL_SECONDS */
export declare const HANDOFF_TTL_SECONDS: number;
export declare const HUB_USER_TOKEN_TTL_SECONDS: number;
export declare const AUTH_APP_IDS: readonly ["tracker", "nexus", "pckg", "platform-spec"];
export declare const AUTH_APP_META: Record<AuthAppId, {
    label: string;
    description: string;
}>;
//# sourceMappingURL=constants.d.ts.map