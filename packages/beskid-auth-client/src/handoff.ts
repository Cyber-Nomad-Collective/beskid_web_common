import { SignJWT, jwtVerify } from "jose";

import {
	AUTH_HUB_ISSUER,
	HUB_USER_TOKEN_TTL_SECONDS,
} from "./constants.js";
import type { AuthAppId, HandoffPayload } from "./v1/types.js";

function secretKey(secret: string): Uint8Array {
	if (secret.length < 32) {
		throw new Error("Service token must be at least 32 characters");
	}
	return new TextEncoder().encode(secret);
}

/** Returns whether a subject is the canonical stable GitHub user identity. */
export function isGitHubSubject(subject: string): boolean {
	const match = /^github:([1-9]\d*)$/.exec(subject);
	if (!match) return false;
	return Number.isSafeInteger(Number(match[1]));
}

export interface IssueHandoffInput {
	app: AuthAppId;
	sessionId: string;
	login: string;
	avatarUrl: string;
	name: string | null;
	/** Stable external identity, for example `github:12345`. */
	subject?: string;
}

export async function issueHandoffToken(
	serviceToken: string,
	input: IssueHandoffInput,
): Promise<string> {
	if (input.app === "pckg" && !isGitHubSubject(input.subject ?? "")) {
		throw new Error("pckg handoffs require a canonical GitHub subject");
	}

	const claims: Record<string, string> = {
		app: input.app,
		sid: input.sessionId,
		login: input.login,
		avatar_url: input.avatarUrl,
	};
	if (input.name) {
		claims.name = input.name;
	}
	if (input.subject) {
		claims.sub = input.subject;
	}

	return new SignJWT(claims)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuer(AUTH_HUB_ISSUER)
		.setIssuedAt()
		.setExpirationTime(`${HUB_USER_TOKEN_TTL_SECONDS}s`)
		.sign(secretKey(serviceToken));
}

export async function verifyHandoffToken(
	serviceToken: string,
	token: string,
	expectedApp?: AuthAppId,
): Promise<HandoffPayload | null> {
	try {
		const { payload } = await jwtVerify(token, secretKey(serviceToken), {
			issuer: AUTH_HUB_ISSUER,
			algorithms: ["HS256"],
		});

		if (typeof payload.app !== "string") return null;
		if (expectedApp && payload.app !== expectedApp) return null;
		if (typeof payload.sid !== "string" || typeof payload.login !== "string") {
			return null;
		}

		const subject = typeof payload.sub === "string" ? payload.sub : null;
		if (expectedApp === "pckg" && !isGitHubSubject(subject ?? "")) {
			return null;
		}

		return {
			app: payload.app as AuthAppId,
			sessionId: payload.sid,
			login: payload.login,
			avatarUrl:
				typeof payload.avatar_url === "string" ? payload.avatar_url : "",
			name: typeof payload.name === "string" ? payload.name : null,
			subject,
			hubUserToken: token,
		};
	} catch {
		return null;
	}
}

export function buildLoginUrl(
	hubPublicUrl: string,
	app: AuthAppId,
): string {
	const base = hubPublicUrl.replace(/\/$/, "");
	return `${base}/login?app=${encodeURIComponent(app)}`;
}

export function buildHandoffFinishUrl(
	appPublicUrl: string,
	handoffToken: string,
): string {
	const base = appPublicUrl.replace(/\/$/, "");
	return `${base}/api/auth/hub-finish?handoff=${encodeURIComponent(handoffToken)}`;
}

export function buildProfileUrl(hubPublicUrl: string): string {
	return `${hubPublicUrl.replace(/\/$/, "")}/profile`;
}

export function buildAccountUrl(hubPublicUrl: string): string {
	return `${hubPublicUrl.replace(/\/$/, "")}/account`;
}

export function githubProxyBaseUrl(hubPublicUrl: string): string {
	return `${hubPublicUrl.replace(/\/$/, "")}/api/v1/github`;
}
