# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `@beskid/ui-react` **0.2.9**: `./graph` (`AstTreeView`, `FactsDagView`, `LinkedAstFactsView`,
  `useAstFactsLink`, fixtures) and `./explorer` (`RepoExplorerDialog`, canonical
  `openInEditorUrl` — local cursor/vscode else GitHub blob).
- `@beskid/beskid-ui` **0.2.8**: Astro book shells `AstGraphShell`, `FactsDagShell`,
  `LinkedAstFactsShell` plus linked-ast-facts client for Starlight/trudoc islands.

### Changed

- Graph consumers import `openInEditorUrl` / `OpenInEditorOptions` from the single
  explorer implementation (graph re-exports only; no duplicate helper module).

## [0.2.7] - 2026-07-13

### Changed

- Auth client handoff types and package pins (prior release baseline for this changelog).
