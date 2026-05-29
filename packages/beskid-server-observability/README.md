# @beskid/server-observability

Prometheus metrics and pino structured logging for Beskid Nitro/Bun apps (auth hub, tracker).

## Usage

```ts
// src/server/observability-middleware.ts
import { createMiddleware } from "@tanstack/react-start";
import { getObservability, initObservability } from "@beskid/server-observability";

initObservability({ service: "beskid-auth" });

export const observabilityMiddleware = createMiddleware().server(async ({ next, request }) => {
  // record HTTP metrics — see site/auth for full implementation
  return next();
});
```

Register on the root route (`server.middleware`) and expose `GET /metrics` via `metricsHandler()`.

Environment: `LOG_LEVEL` (default `info`).
