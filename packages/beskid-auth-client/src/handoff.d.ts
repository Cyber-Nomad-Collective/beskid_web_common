import type { AuthAppId, HandoffPayload } from "./v1/types.js";
/** Returns whether a subject is the canonical stable GitHub user identity. */
export declare function isGitHubSubject(subject: string): boolean;
export interface IssueHandoffInput {
    app: AuthAppId;
    sessionId: string;
    login: string;
    avatarUrl: string;
    name: string | null;
    /** Stable external identity, for example `github:12345`. */
    subject?: string;
}
export declare function issueHandoffToken(serviceToken: string, input: IssueHandoffInput): Promise<string>;
export declare function verifyHandoffToken(serviceToken: string, token: string, expectedApp?: AuthAppId): Promise<HandoffPayload | null>;
export declare function buildLoginUrl(hubPublicUrl: string, app: AuthAppId): string;
export declare function buildHandoffFinishUrl(appPublicUrl: string, handoffToken: string): string;
export declare function buildProfileUrl(hubPublicUrl: string): string;
export declare function buildAccountUrl(hubPublicUrl: string): string;
export declare function githubProxyBaseUrl(hubPublicUrl: string): string;
//# sourceMappingURL=handoff.d.ts.map