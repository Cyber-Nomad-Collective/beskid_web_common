import pino from "pino";
import { Registry, collectDefaultMetrics, Counter, Histogram, } from "prom-client";
const PINO_LEVELS = new Set([
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
    "silent",
]);
function resolveLogLevel() {
    const fromEnv = process.env.LOG_LEVEL;
    if (fromEnv && PINO_LEVELS.has(fromEnv.toLowerCase())) {
        return fromEnv.toLowerCase();
    }
    return "info";
}
export function normalizeRoute(pathname) {
    if (!pathname || pathname === "/")
        return "/";
    const withoutQuery = pathname.split("?")[0] ?? pathname;
    if (withoutQuery.startsWith("/api/")) {
        const parts = withoutQuery.split("/").filter(Boolean);
        if (parts.length >= 3) {
            return `/${parts.slice(0, 3).join("/")}`;
        }
    }
    return withoutQuery.length > 80
        ? `${withoutQuery.slice(0, 77)}...`
        : withoutQuery;
}
export function createObservability(options) {
    const { service } = options;
    const registry = new Registry();
    registry.setDefaultLabels({ service });
    collectDefaultMetrics({ register: registry });
    const httpRequestDuration = new Histogram({
        name: "http_request_duration_seconds",
        help: "HTTP request duration in seconds",
        labelNames: ["method", "route", "status_code"],
        registers: [registry],
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });
    const httpRequestsTotal = new Counter({
        name: "http_requests_total",
        help: "Total HTTP requests",
        labelNames: ["method", "route", "status_code"],
        registers: [registry],
    });
    const logger = pino({
        level: resolveLogLevel(),
        base: { service },
    });
    const recordHttpRequest = (method, route, statusCode, durationSeconds) => {
        const labels = {
            method: method.toUpperCase(),
            route: normalizeRoute(route),
            status_code: String(statusCode),
        };
        httpRequestDuration.observe(labels, durationSeconds);
        httpRequestsTotal.inc(labels);
    };
    return {
        service,
        registry,
        logger,
        httpRequestDuration,
        httpRequestsTotal,
        renderMetrics: () => registry.metrics(),
        recordHttpRequest,
    };
}
let defaultBundle;
export function initObservability(options) {
    defaultBundle = createObservability(options);
    return defaultBundle;
}
export function getObservability() {
    if (!defaultBundle) {
        throw new Error("Observability not initialized — call initObservability() at server startup");
    }
    return defaultBundle;
}
export async function metricsHandler() {
    const bundle = getObservability();
    const body = await bundle.renderMetrics();
    return new Response(body, {
        headers: {
            "Content-Type": bundle.registry.contentType,
        },
    });
}
