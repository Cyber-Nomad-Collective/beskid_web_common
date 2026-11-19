# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Keep the header brand mark in the theme accent instead of inheriting visited-link purple.


- Render an explicitly styled mobile menu button with visible icons, a compact target matching the service launcher, expanded state and Escape dismissal.

### Added

- Allow the website to opt into Blog links in desktop and mobile header navigation.


### Changed

- Move shared package validation and reviewed GitHub Packages publication to
  the root beskid Woodpecker pipeline, with token-free prebuilt artifacts and
  exact authored package versions.

- Generate shared Ridge and service hub artwork from the canonical brand SVGs,
  reuse one icon renderer across Astro and React, and update the shared header mark.

- Apply Emerald primary accents to the shared UI and trudoc themes while retaining
  existing surfaces, neutral and secondary colors, typography, and layout tokens.

### Fixed

- Align documentation navigation source checks with the dedicated searchable Docs
  rail and the Learn menu containing guides, Standard, and Book.

- Use exact release-platform identifiers throughout the download widget, reject
  legacy architecture fields even beside exact platform IDs, and show
  metadata-gated packages with channel, immutable pin, install, upgrade,
  uninstall, and editor guidance.
- Expose Downloads from the desktop navigation and label the documentation
  menu as Learn, matching the public website navigation.
- Populate the Docs navigation tree with the public getting-started, tooling,
  project, package, standard, and contribution pages.
- Keep the Docs menu within the viewport by anchoring it to its trailing edge.
- Keep Shiki's light-token colors from leaking into dark landing terminals.

### Fixed

- Keep the landing-page code preview at a readable fixed height with its own
  scroll viewport, and render multi-file selectors as editor tabs.
- Render the Docs table of contents in the left navigation pane and consolidate
  the desktop header into Home, a Docs menu, and Learn.
- Route shared hub navigation to the canonical Beskid Standard documentation
  surface instead of the retired Platform Spec service, with one service
  registry reused by both React and Astro shells.
- Export the complete shadcn Tailwind v4 semantic color, radius, chart, and
  sidebar mapping from `shadcn-entry.css` for isolated consumers.
- Restrict auth hub application identities to the four deployed interactive
  services (`tracker`, `nexus`, `pckg`, and `learn`) and restore the auth
  package to the repository-wide typecheck gate under its canonical name.
- Ship `@types/d3-hierarchy` with `@beskid/ui-react` so isolated consumers can
  compile the package's exported graph source without undeclared ambient types.
- Keep the shared downloads widget renderable when a statically hosted version endpoint returns an incomplete error payload instead of release metadata.

- Declare the auth client with its canonical `@beskid/auth-client` identity so
  file-linked consumers resolve the same package name in frozen CI installs.
- Resolve `@dagrejs/dagre` Graph via fail-closed interop helper so Facts DAG layout
  no longer crashes with `gm.Graph is not a constructor` when a hoisted v1 CJS
  package shadows the ui-react v3 named export.
- Align `@beskid/beskid-ui` on `@dagrejs/dagre@^3.0.0` (drop v1 dual dependency).

### Added

- `@beskid/ui-react` **0.2.9**: `./graph` (`AstTreeView`, `FactsDagView`, `LinkedAstFactsView`,
  `useAstFactsLink`, fixtures) and `./explorer` (`RepoExplorerDialog`, canonical
  `openInEditorUrl` — local cursor/vscode else GitHub blob).
- `@beskid/beskid-ui` **0.2.8**: Astro book shells `AstGraphShell`, `FactsDagShell`,
  `LinkedAstFactsShell` plus linked-ast-facts client for Starlight/trudoc islands.

### Changed

- License Beskid-owned reusable web packages under Apache-2.0 and include the
  license and notice in published package contents.
- Graph consumers import `openInEditorUrl` / `OpenInEditorOptions` from the single
  explorer implementation (graph re-exports only; no duplicate helper module).
- Route the repository `test` script through the React package's Vitest/jsdom runner so
  DOM component tests use their declared environment instead of Bun's raw test runner.

## [0.2.7] - 2026-07-13

### Changed

- Auth client handoff types and package pins (prior release baseline for this changelog).
