import { AUTH_API_VERSION } from "../constants.js";
import type {
	AdminSetupRequest,
	AdminStatusResponse,
	AppsResponse,
	ErrorResponse,
	HealthResponse,
	MeResponse,
	OkResponse,
	PairingApproveRequest,
	PairingApproveResponse,
	PairingRequestCreate,
	PairingRequestCreated,
	PairingStatusResponse,
} from "./types.js";

export interface BeskidAuthClientOptions {
	baseUrl: string;
	fetch?: typeof fetch;
}

export class BeskidAuthClient {
	private readonly baseUrl: string;
	private readonly fetchFn: typeof fetch;

	constructor(options: BeskidAuthClientOptions) {
		this.baseUrl = options.baseUrl.replace(/\/$/, "");
		this.fetchFn = options.fetch ?? fetch;
	}

	get apiBase(): string {
		return `${this.baseUrl}/api/${AUTH_API_VERSION}`;
	}

	get openApiUrl(): string {
		return `${this.apiBase}/openapi.json`;
	}

	async getHealth(): Promise<HealthResponse> {
		return this.getJson<HealthResponse>("/health");
	}

	async getMe(cookieHeader?: string): Promise<MeResponse | null> {
		const res = await this.request("/me", { cookieHeader });
		if (res.status === 401) return null;
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return (await res.json()) as MeResponse;
	}

	async listApps(): Promise<AppsResponse> {
		return this.getJson<AppsResponse>("/apps");
	}

	async getAdminStatus(setupToken?: string): Promise<AdminStatusResponse> {
		return this.getJson<AdminStatusResponse>(
			"/admin/status",
			setupToken ? { bearer: setupToken } : undefined,
		);
	}

	async createPairingRequest(
		body: PairingRequestCreate,
		cookieHeader: string,
	): Promise<PairingRequestCreated> {
		const res = await this.request("/pairing/requests", {
			method: "POST",
			body: JSON.stringify(body),
			headers: { "Content-Type": "application/json" },
			cookieHeader,
		});
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return (await res.json()) as PairingRequestCreated;
	}

	async approvePairing(
		body: PairingApproveRequest,
	): Promise<PairingApproveResponse> {
		const res = await this.request("/pairing/approve", {
			method: "POST",
			body: JSON.stringify(body),
			headers: { "Content-Type": "application/json" },
		});
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		const parsed = (await res.json()) as PairingApproveResponse & {
			handoffSecret?: string;
		};
		if (!parsed.serviceToken && parsed.handoffSecret) {
			return { serviceToken: parsed.handoffSecret };
		}
		return parsed;
	}

	async getPairingStatus(appId: PairingApproveRequest["appId"]): Promise<PairingStatusResponse> {
		const res = await this.request(
			`/pairing/status?appId=${encodeURIComponent(appId)}`,
		);
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return (await res.json()) as PairingStatusResponse;
	}

	async postAdminSetup(
		body: AdminSetupRequest,
	): Promise<OkResponse> {
		const res = await this.request("/admin/setup", {
			method: "POST",
			body: JSON.stringify(body),
			headers: { "Content-Type": "application/json" },
			bearer: body.setupToken,
		});
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return (await res.json()) as OkResponse;
	}

	private async getJson<T>(
		path: string,
		auth?: { bearer?: string; cookieHeader?: string },
	): Promise<T> {
		const res = await this.request(path, auth);
		if (!res.ok) {
			throw await this.errorFromResponse(res);
		}
		return (await res.json()) as T;
	}

	private async request(
		path: string,
		init?: RequestInit & { bearer?: string; cookieHeader?: string },
	): Promise<Response> {
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

	private async errorFromResponse(res: Response): Promise<Error> {
		try {
			const body = (await res.json()) as ErrorResponse;
			return new Error(body.error || `HTTP ${res.status}`);
		} catch {
			return new Error(`HTTP ${res.status}`);
		}
	}
}
