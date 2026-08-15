import { BeskidAuthClient } from "./client.js";
function normalizeInput(input) {
    const appId = input.appId;
    const hubUrl = input.hubUrl.trim();
    const code = input.code.trim();
    const publicUrl = input.publicUrl.trim().replace(/\/$/, "");
    const approverLogin = input.approverLogin.trim();
    if (!code || !publicUrl || !approverLogin) {
        return { ok: false, reason: "invalid" };
    }
    if (!hubUrl) {
        return { ok: false, reason: "not_configured" };
    }
    return { appId, hubUrl, code, publicUrl, approverLogin };
}
export async function approveAuthHubPairing(input) {
    const normalized = normalizeInput(input);
    if ("ok" in normalized)
        return normalized;
    const client = new BeskidAuthClient({ baseUrl: normalized.hubUrl });
    const result = await client.approvePairing({
        appId: normalized.appId,
        approverLogin: normalized.approverLogin,
        code: normalized.code,
        publicUrl: normalized.publicUrl,
    });
    if (!result?.serviceToken || result.serviceToken.length < 16) {
        return { ok: false, reason: "invalid" };
    }
    return { ok: true, serviceToken: result.serviceToken };
}
export function pairingFailureMessage(reason, options) {
    switch (reason) {
        case "not_configured":
            return "AUTH_HUB_PUBLIC_URL is not configured on this service.";
        default:
            return (options?.approverHint ??
                "Invalid pairing request (missing code or public URL).");
    }
}
