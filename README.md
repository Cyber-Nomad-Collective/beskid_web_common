# beskid_web_common

Shared **TypeScript** packages for Beskid documentation sites (`site/website`), **beskid_tracker**, and related tooling. Normative MDX content stays in the [beskid](https://github.com/Cyber-Nomad-Collective/beskid) superrepo under `site/website/src/content/docs/`.

## Packages

| Package | npm name | Purpose |
|---------|----------|---------|
| [trudoc](./packages/trudoc/) | `@cyber-nomad-collective/trudoc` | Layout trees, platform-spec/book nav, Zod schemas, verify CLI, Astro integration |
| [docs-ui](./packages/docs-ui/) | `@cyber-nomad-collective/docs-ui` | Starlight chrome, platform-spec reader, book shell, hub widget |
| [eslint-config](./packages/eslint-config/) | `@cyber-nomad-collective/eslint-config` | Reserved (not published yet) |

**Dependency rule:** `@cyber-nomad-collective/docs-ui` → `@cyber-nomad-collective/trudoc` only (no reverse dependency).

**Import alias:** GitHub Packages scope must match the org (`@cyber-nomad-collective`). Apps may keep `@beskid/*` imports via npm aliases (see [`.npmrc.example`](./.npmrc.example)).

## Development

```bash
bun install
bun run typecheck
bun run build   # hub client bundle for @beskid/docs-ui
```

## Publishing (GitHub Packages)

Packages publish to `https://npm.pkg.github.com` under the `@cyber-nomad-collective` scope when a version tag is pushed (`v*` → all packages) or manually via workflow dispatch.

### Consumer `.npmrc`

Copy [`.npmrc.example`](./.npmrc.example):

```ini
@cyber-nomad-collective:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Use a PAT or `GITHUB_TOKEN` with `read:packages` (and `write:packages` for publish).

### Superrepo dependency (published)

Until the superrepo drops vendored `packages/trudoc`, consumers can alias the legacy name:

```json
{
  "dependencies": {
    "@cyber-nomad-collective/docs-ui": "^0.1.0",
    "trudoc": "npm:@cyber-nomad-collective/trudoc@^0.1.0",
    "@beskid/trudoc": "npm:@cyber-nomad-collective/trudoc@^0.1.0"
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
