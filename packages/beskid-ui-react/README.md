# @cyber-nomad-collective/beskid-ui-react

Shared **shadcn** React components extracted from Beskid Tracker for auth, account, and admin UIs.

## Exports

- `@cyber-nomad-collective/beskid-ui-react` — barrel
- `@cyber-nomad-collective/beskid-ui-react/button`, `/input`, `/card`, … (`./ui/*`)
- `@cyber-nomad-collective/beskid-ui-react/auth` — `AuthPageShell`, `ServicePicker`, `ProfileCard`
- `@cyber-nomad-collective/beskid-ui-react/settings` — `SettingsDialog`, `defineSettingsRegistry`, `SettingsProvider`, form renderer

Tracker can re-export from local shims:

```ts
export { Button, buttonVariants } from "@beskid/ui-react/button";
export { SettingsDialog } from "@beskid/ui-react/settings";
```

Import `@cyber-nomad-collective/beskid-ui-react/styles/shadcn-entry.css` or mirror tokens in the host app (see `site/auth/src/styles.css`).

## Publish to GitHub Packages

The `./settings` subpath is included in `package.json` `exports` and `files` (`src/**`). Docker-only tracker builds require a published package — local Vite aliases are dev-only.

### CI (preferred)

Push a version tag on `beskid_web_common` (`v*` → all publishable packages) or run the **Publish** workflow manually with a version input. The workflow uses `GITHUB_TOKEN` as `NODE_AUTH_TOKEN`.

### Local publish (requires token)

```bash
cd beskid_web_common
cp .npmrc.example .npmrc   # set //npm.pkg.github.com/:_authToken
export NODE_AUTH_TOKEN="<PAT with write:packages>"

bun install
bun run typecheck
bun run build

cd packages/beskid-ui-react
npm publish --access public
```

After publish, refresh superrepo consumers:

```bash
./scripts/sync-beskid-packages.sh beskid_tracker site/auth
```

**Blocker without token:** publish cannot run locally or in CI without `NODE_AUTH_TOKEN` / `GITHUB_TOKEN` with `write:packages`. The export surface is ready; only registry upload remains.
