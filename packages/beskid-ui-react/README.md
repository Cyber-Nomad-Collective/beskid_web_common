# @cyber-nomad-collective/beskid-ui-react

Shared **shadcn** React components extracted from Beskid Tracker for auth, account, and admin UIs.

## Exports

- `@cyber-nomad-collective/beskid-ui-react` — barrel
- `@cyber-nomad-collective/beskid-ui-react/button`, `/input`, `/card`, …
- `@cyber-nomad-collective/beskid-ui-react/auth` — `AuthPageShell`, `ServicePicker`, `ProfileCard`

Tracker can re-export from local shims:

```ts
export { Button, buttonVariants } from "@beskid/ui-react/button";
```

Import `@cyber-nomad-collective/beskid-ui-react/styles/theme.css` or mirror tokens in the host app (see `site/auth/src/styles.css`).
