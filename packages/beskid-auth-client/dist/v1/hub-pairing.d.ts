import type { AuthAppId } from "./types.js";
export type AuthHubPairingFailureReason = "not_configured" | "invalid";
export interface AuthHubPairingApprovalInput {
    appId: AuthAppId;
    hubUrl: string;
    code: string;
    publicUrl: string;
    approverLogin: string;
}
export interface AuthHubPairingApprovalResponse {
    ok: true;
    serviceToken: string;
}
export interface AuthHubPairingApprovalError {
    ok: false;
    reason: AuthHubPairingFailureReason;
}
export type AuthHubPairingApprovalResult = AuthHubPairingApprovalResponse | AuthHubPairingApprovalError;
export declare function approveAuthHubPairing(input: AuthHubPairingApprovalInput): Promise<AuthHubPairingApprovalResult>;
export declare function pairingFailureMessage(reason: AuthHubPairingFailureReason, options?: {
    approverHint?: string;
}): string;
//# sourceMappingURL=hub-pairing.d.ts.map