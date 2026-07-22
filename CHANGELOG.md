# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

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

- Graph consumers import `openInEditorUrl` / `OpenInEditorOptions` from the single
  explorer implementation (graph re-exports only; no duplicate helper module).
- Route the repository `test` script through the React package's Vitest/jsdom runner so
  DOM component tests use their declared environment instead of Bun's raw test runner.

## [0.2.7] - 2026-07-13

### Changed

- Auth client handoff types and package pins (prior release baseline for this changelog).
