import { AUTH_API_VERSION } from "../constants.js";
export class BeskidAuthClient {
	baseUrl;
	fetchFn;
	constructor(options) {
		this.baseUrl = options.baseUrl.replace(/\/$/, "");
		this.fetchFn = options.fetch ?? fetch;
	}
	get apiBase() {
		return `${this.baseUrl}/api/${AUTH_API_VERSION}`;
	}
	get openApiUrl() {
		return `${this.apiBase}/openapi.json`;
	}
	async getHealth() {
		return this.getJson("/health");
	}
	async getMe(cookieHeader) {
		const res = await this.request("/me", { cookieHeader });
		if (res.status === 401) return null;
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return await res.json();
	}
	async listApps() {
		return this.getJson("/apps");
	}
	/** Discover hub health, app metadata, and pairing state in one request contract. */
	async discoverApp(appId) {
		const [health, apps, pairing] = await Promise.all([
			this.getHealth(),
			this.listApps(),
			this.getPairingStatus(appId),
		]);
		return {
			health,
			app: apps.apps.find((candidate) => candidate.id === appId) ?? null,
			pairing,
		};
	}
	async getAdminStatus(setupToken) {
		return this.getJson(
			"/admin/status",
			setupToken ? { bearer: setupToken } : undefined,
		);
	}
	async createPairingRequest(body, cookieHeader) {
		const res = await this.request("/pairing/requests", {
			method: "POST",
			body: JSON.stringify(body),
			headers: { "Content-Type": "application/json" },
			cookieHeader,
		});
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return await res.json();
	}
	async approvePairing(body) {
		const res = await this.request("/pairing/approve", {
			method: "POST",
			body: JSON.stringify(body),
			headers: { "Content-Type": "application/json" },
		});
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		const parsed = await res.json();
		if (!parsed.serviceToken && parsed.handoffSecret) {
			return { serviceToken: parsed.handoffSecret };
		}
		return parsed;
	}
	async getPairingStatus(appId) {
		const res = await this.request(
			`/pairing/status?appId=${encodeURIComponent(appId)}`,
		);
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return await res.json();
	}
	async postAdminSetup(body) {
		const res = await this.request("/admin/setup", {
			method: "POST",
			body: JSON.stringify(body),
			headers: { "Content-Type": "application/json" },
			bearer: body.setupToken,
		});
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return await res.json();
	}
	async getJson(path, auth) {
		const res = await this.request(path, auth);
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return await res.json();
	}
	async request(path, init) {
		const headers = new Headers(init?.headers);
		if (init?.bearer) {
			headers.set("Authorization", `Bearer ${init.bearer}`);
		}
		if (init?.cookieHeader) {
			headers.set("Cookie", init.cookieHeader);
		}
		return this.fetchFn(`${this.apiBase}${path}`, {
			...init,
			headers,
		});
	}
	async errorFromResponse(res) {
		try {
			const body = await res.json();
			return new Error(body.error || `HTTP ${res.status}`);
		} catch {
			return new Error(`HTTP ${res.status}`);
		}
	}
}
