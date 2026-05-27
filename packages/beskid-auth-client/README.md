# @cyber-nomad-collective/beskid-auth-client

Typed client for the Beskid auth hub **OpenAPI v1** and shared **handoff JWT** utilities.

## Install

```json
{
  "dependencies": {
    "@cyber-nomad-collective/beskid-auth-client": "^0.1.0"
  }
}
```

Superrepo local dev:

```json
"@beskid/auth-client": "file:../../beskid_web_common/packages/beskid-auth-client"
```

## Handoff (downstream apps)

```ts
import { verifyHandoffToken, buildLoginUrl } from "@beskid/auth-client";

const payload = await verifyHandoffToken(process.env.AUTH_HUB_SECRET!, token, "tracker");
const loginUrl = buildLoginUrl(process.env.AUTH_HUB_PUBLIC_URL!, "nexus");
```

Contract: issuer `beskid-auth-hub`, HS256, 120s TTL, claims `app`, `access_token`, `login`, `avatar_url`, optional `name`.

## HTTP client

```ts
import { BeskidAuthClient } from "@beskid/auth-client";

const client = new BeskidAuthClient({ baseUrl: "https://auth.beskid-lang.org" });
await client.getHealth();
await client.listApps();
```

OpenAPI source: [`openapi/v1/openapi.yaml`](openapi/v1/openapi.yaml). Live document: `GET /api/v1/openapi.json`.
