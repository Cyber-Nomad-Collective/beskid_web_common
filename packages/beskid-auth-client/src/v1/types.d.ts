/** OpenAPI v1 schema types (hand-maintained from openapi/v1/openapi.yaml). */
export type AuthAppId = "tracker" | "nexus" | "pckg";
export interface AuthUser {
    login: string;
    name: string | null;
    avatarUrl: string;
}
export interface HealthResponse {
    ok: true;
    version: string;
}
export interface MeResponse {
    user: AuthUser;
    isAdmin: boolean;
}
export interface AuthApp {
    id: AuthAppId;
    label: string;
    description: string;
    publicUrl: string;
    loginUrl: string;
    enabled?: boolean;
}
export interface AppsResponse {
    apps: AuthApp[];
}
export interface AdminStatusResponse {
    onboarded: boolean;
    oauthConfigured: boolean;
    oauthSource?: "env" | "db" | "file" | "none";
    hasSessionSecret: boolean;
    hasSetupToken?: boolean;
    appCount: number;
}
export interface AdminSetupRequest {
    setupToken?: string;
    githubClientId: string;
    githubClientSecret: string;
    githubOAuthCallbackUrl: string;
    adminGitHubLogins: string[];
    apps?: Array<{
        id: AuthAppId;
        publicUrl: string;
        enabled?: boolean;
    }>;
}
export interface PairingRequestCreate {
    appId: AuthAppId;
    publicUrl: string;
}
export interface PairingRequestCreated {
    requestId: string;
    pairingCode: string;
    expiresAt: string;
    approveUrlTemplate: string;
}
export interface PairingApproveRequest {
    code: string;
    appId: AuthAppId;
    publicUrl: string;
    approverLogin: string;
    approvalNonce?: string;
}
export interface PairingApproveResponse {
    /** Long-lived credential for this consumer app (store server-side only). */
    serviceToken: string;
}
export interface PairingStatusResponse {
    appId: AuthAppId;
    paired: boolean;
    publicUrl?: string;
}
export interface ErrorResponse {
    error: string;
}
export interface OkResponse {
    ok: true;
}
export interface HandoffPayload {
    app: AuthAppId;
    /** Hub-side session id (GitHub token stays on the auth hub). */
    sessionId: string;
    login: string;
    avatarUrl: string;
    name: string | null;
    /** JWT to send to the hub GitHub proxy (`Authorization: Bearer`). */
    hubUserToken: string;
}
