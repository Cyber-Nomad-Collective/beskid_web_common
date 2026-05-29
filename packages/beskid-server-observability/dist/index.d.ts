import { type Logger } from "pino";
import { Registry, Counter, Histogram } from "prom-client";
export interface ObservabilityOptions {
    service: string;
}
export interface ObservabilityBundle {
    service: string;
    registry: Registry;
    logger: Logger;
    httpRequestDuration: Histogram<"method" | "route" | "status_code">;
    httpRequestsTotal: Counter<"method" | "route" | "status_code">;
    renderMetrics: () => Promise<string>;
    recordHttpRequest: (method: string, route: string, statusCode: number, durationSeconds: number) => void;
}
export declare function normalizeRoute(pathname: string): string;
export declare function createObservability(options: ObservabilityOptions): ObservabilityBundle;
export declare function initObservability(options: ObservabilityOptions): ObservabilityBundle;
export declare function getObservability(): ObservabilityBundle;
export declare function metricsHandler(): Promise<Response>;
//# sourceMappingURL=index.d.ts.map