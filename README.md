# beskid_web_common

Shared **TypeScript** packages for Beskid documentation sites (`site/website`), **beskid_tracker**, and related tooling. Normative MDX content stays in the [beskid](https://github.com/Cyber-Nomad-Collective/beskid) superrepo under `site/website/src/content/docs/`.

## Packages

| Package | npm name | Purpose |
|---------|----------|---------|
| [trudoc](./packages/trudoc/) | `@beskid/trudoc` | Layout trees, platform-spec/book nav, Zod schemas, verify CLI, Astro integration |
| [docs-ui](./packages/docs-ui/) | `@beskid/docs-ui` | Starlight chrome, platform-spec reader, book shell, hub widget |
| [eslint-config](./packages/eslint-config/) | `@beskid/eslint-config` | Reserved (not published yet) |

**Dependency rule:** `@beskid/docs-ui` → `@beskid/trudoc` only (no reverse dependency).

## Development

```bash
bun install
bun run typecheck
bun run build   # hub client bundle for @beskid/docs-ui
```

## Publishing (GitHub Packages)

Packages publish to `https://npm.pkg.github.com` under the `@beskid` scope when a version tag is pushed (`v*` → all packages) or manually via workflow dispatch.

### Consumer `.npmrc`

Copy [`.npmrc.example`](./.npmrc.example):

```ini
@beskid:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Use a PAT or `GITHUB_TOKEN` with `read:packages` (and `write:packages` for publish).

### Superrepo dependency (published)

Until the superrepo drops vendored `packages/trudoc`, consumers can alias the legacy name:

```json
{
  "dependencies": {
    "@beskid/docs-ui": "^0.1.0",
    "trudoc": "npm:@beskid/trudoc@^0.1.0"
  }
}
```

Imports in site code can keep `from 'trudoc/...'` via the npm alias.

### Superrepo dependency (local submodule)

For day-to-day Beskid development, prefer a **git submodule** at `packages/web-common` (or a sibling clone) and root workspaces:

```json
"workspaces": ["packages/*", "packages/web-common/packages/*", "site/website"]
```

See [beskid `docs/beskid-web-common.md`](https://github.com/Cyber-Nomad-Collective/beskid/blob/main/docs/beskid-web-common.md) for the full migration matrix.

## CSS mirroring

`packages/trudoc/css/` and `packages/docs-ui/src/styles/` intentionally mirror platform-spec styles. When changing tokens, update **both** trees until a single `@beskid/docs-ui` style entrypoint replaces the duplicate (tracked in migration doc).
