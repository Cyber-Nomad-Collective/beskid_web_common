import { defineNitroPlugin } from "nitro/runtime";
import { getObservability, initObservability, } from "./index.js";
export function createObservabilityNitroPlugin(options) {
    initObservability(options);
    return defineNitroPlugin((nitroApp) => {
        const bundle = getObservability();
        nitroApp.hooks.hook("request", (event) => {
            event.context._obsStart = performance.now();
        });
        nitroApp.hooks.hook("beforeResponse", (event) => {
            const start = event.context._obsStart;
            if (start === undefined)
                return;
            const pathname = event.path ?? event.url?.pathname ?? "/";
            if (pathname === "/metrics")
                return;
            const durationSeconds = (performance.now() - start) / 1000;
            const statusCode = event.node?.res?.statusCode ?? 200;
            const method = event.method ?? event.node?.req?.method ?? "GET";
            bundle.recordHttpRequest(method, pathname, statusCode, durationSeconds);
        });
    });
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
