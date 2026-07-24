import type {
	AdminSetupRequest,
	AdminStatusResponse,
	AppsResponse,
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
export declare class BeskidAuthClient {
	private readonly baseUrl;
	private readonly fetchFn;
	constructor(options: BeskidAuthClientOptions);
	get apiBase(): string;
	get openApiUrl(): string;
	getHealth(): Promise<HealthResponse>;
	getMe(cookieHeader?: string): Promise<MeResponse | null>;
	listApps(): Promise<AppsResponse>;
	/** Discover hub health, app metadata, and pairing state in one request contract. */
	discoverApp(
		appId: PairingApproveRequest["appId"],
	): Promise<import("./types.js").AuthDiscovery>;
	getAdminStatus(setupToken?: string): Promise<AdminStatusResponse>;
	createPairingRequest(
		body: PairingRequestCreate,
		cookieHeader: string,
	): Promise<PairingRequestCreated>;
	approvePairing(body: PairingApproveRequest): Promise<PairingApproveResponse>;
	getPairingStatus(
		appId: PairingApproveRequest["appId"],
	): Promise<PairingStatusResponse>;
	postAdminSetup(body: AdminSetupRequest): Promise<OkResponse>;
	private getJson;
	private request;
	private errorFromResponse;
}
//# sourceMappingURL=client.d.ts.map
