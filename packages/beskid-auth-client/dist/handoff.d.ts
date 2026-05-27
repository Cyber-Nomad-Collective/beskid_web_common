import type { AuthAppId, HandoffPayload } from "./v1/types.js";
export interface IssueHandoffInput {
    app: AuthAppId;
    sessionId: string;
    login: string;
    avatarUrl: string;
    name: string | null;
}
export declare function issueHandoffToken(serviceToken: string, input: IssueHandoffInput): Promise<string>;
export declare function verifyHandoffToken(serviceToken: string, token: string, expectedApp?: AuthAppId): Promise<HandoffPayload | null>;
export declare function buildLoginUrl(hubPublicUrl: string, app: AuthAppId): string;
export declare function buildHandoffFinishUrl(appPublicUrl: string, handoffToken: string): string;
export declare function buildProfileUrl(hubPublicUrl: string): string;
export declare function buildAccountUrl(hubPublicUrl: string): string;
export declare function githubProxyBaseUrl(hubPublicUrl: string): string;
//# sourceMappingURL=handoff.d.ts.map