# spec CLI

Normative platform-spec workspace management (`@cyber-nomad-collective/spec-cli`).

## Superrepo layout

Canonical normative JSON lives in the **`site/spec-content`** git submodule
(`Cyber-Nomad-Collective/beskid_normative_spec`). From the Beskid superrepo root:

```bash
git submodule update --init site/spec-content
bun run spec init
bun run spec validate
```

`spec init` defaults to `site/spec-content` when present. Override with `--dir` or
`SPEC_WORKSPACE_DIR`.

## Migrate from legacy MDX

```bash
bun run spec init --from-mdx site/website/src/content/docs/platform-spec
```

## Node layout

Each Domain, Area, and Feature hub directory contains `node.json`, `layout.json`,
`content.md`, `related.json`, plus `articles/` and `adr/` subdirectories.

```bash
bun run spec new node -t Feature --slug platform-spec/compiler/build-pipeline/stage-ordering
bun run spec layout generate --path platform-spec/compiler
```

## Local reader

```bash
SPEC_LOCAL_WORKSPACE=site/spec-content bun run --cwd site/platform-spec dev
```
