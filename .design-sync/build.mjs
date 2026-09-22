// design-sync build for @cyber-nomad-collective/beskid-ui-react.
//
// The package ships raw TypeScript + Tailwind utility classes (consumers
// compile both), so there is no dist/ for the converter to read. This script
// stages a published-like copy under .design-sync/.cache/pkg/:
//   src/ds-all.ts     full-surface entry: index.ts + every components/ui/*
//                     module + settings/graph/explorer subpath indexes
//   types/            tsc --emitDeclarationOnly output (converter's .d.ts tree)
//   beskid.css        Tailwind v4 build over the package src + authored
//                     previews, with Beskid Material tokens and shadcn theme
//   package.json      name/version from the real package; types -> ds-all.d.ts
//
// Run from the beskid_web_common root: node .design-sync/build.mjs
// Needs: pnpm i --frozen-lockfile (package deps) and the staged converter deps
// in .ds-sync/ (typescript comes from the package, tailwind from .ds-sync).
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const pkgDir = join(root, 'packages/beskid-ui-react');
const themePkgDir = join(root, 'packages/beskid-ui');
const out = join(root, '.design-sync/.cache/pkg');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(pkgDir, 'src'), join(out, 'src'), { recursive: true });
symlinkSync(relative(out, join(pkgDir, 'node_modules')), join(out, 'node_modules'));

// Full-surface entry. index.ts only re-exports a subset; apps import the rest
// through the ./ui/*, ./settings, ./graph, ./explorer subpaths.
const uiMods = readdirSync(join(pkgDir, 'src/components/ui'))
  .filter((f) => f.endsWith('.tsx') && !/\.(test|spec|stories)\./.test(f))
  .sort()
  .map((f) => `./components/ui/${f.replace(/\.tsx$/, '')}`);
const mods = ['./index', ...uiMods, './components/settings/index', './graph/index', './explorer/index', './theme-root'];
writeFileSync(join(out, 'src/ds-all.ts'), mods.map((m) => `export * from ${JSON.stringify(m)};`).join('\n') + '\n');
cpSync(join(root, '.design-sync/theme-root.tsx'), join(out, 'src/theme-root.tsx'));

const realPkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
writeFileSync(join(out, 'package.json'), JSON.stringify({
  name: realPkg.name,
  version: realPkg.version,
  description: realPkg.description,
  type: 'module',
  module: 'src/ds-all.ts',
  types: 'types/ds-all.d.ts',
  dependencies: realPkg.dependencies,
  peerDependencies: realPkg.peerDependencies,
}, null, 2) + '\n');

writeFileSync(join(out, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx',
    strict: true, skipLibCheck: true, resolveJsonModule: true,
    declaration: true, emitDeclarationOnly: true, noEmitOnError: false,
    rootDir: 'src', outDir: 'types', types: ['node'],
  },
  include: ['src'],
  exclude: ['src/**/*.test.*', 'src/**/*.spec.*'],
}, null, 2) + '\n');

// Declarations. Duplicate type re-exports across subpath indexes (e.g.
// OpenInEditorScheme) are diagnostics only; emit proceeds (noEmitOnError off).
const tsc = join(pkgDir, 'node_modules/typescript/bin/tsc');
try {
  execFileSync(process.execPath, [tsc, '-p', join(out, 'tsconfig.json')], { stdio: 'pipe' });
} catch (e) {
  const msg = String(e.stdout ?? '') + String(e.stderr ?? '');
  const errs = msg.split('\n').filter((l) => /error TS/.test(l));
  console.error(`[ds-build] tsc reported ${errs.length} diagnostics (declarations still emitted):`);
  for (const l of errs.slice(0, 20)) console.error('  ' + l);
}
if (!existsSync(join(out, 'types/ds-all.d.ts'))) {
  console.error('[ds-build] types/ds-all.d.ts missing after tsc');
  process.exit(1);
}

// Stylesheet: the same recipe consumer apps use (site/auth, beskid_tracker),
// with @beskid/material-theme resolved to its source file.
const rel = (p) => relative(out, p).split('\\').join('/');
writeFileSync(join(out, 'beskid.tw.css'), `@import "${rel(join(root, '.ds-sync/node_modules/tailwindcss/index.css'))}";

@source "./src";
@source "${rel(join(root, '.design-sync/previews'))}";
@source inline("rounded-4xl");

@import "${rel(join(themePkgDir, 'src/styles/theme.material.css'))}";
@import "${rel(join(pkgDir, 'src/styles/shadcn-theme.css'))}";
@import "${rel(join(pkgDir, 'src/styles/hub.css'))}";
@import "./shadcn-bridge.css";

@custom-variant dark (&:is([data-theme="dark"] *));

@theme inline {
	--font-sans: ui-sans-serif, system-ui, sans-serif;
}

@layer base {
	* {
		@apply border-border outline-ring/50;
	}
	body {
		@apply bg-background text-foreground;
	}
}
`);
// shadcn-entry.css minus its beskid-tokens/shadcn-theme @imports (the tokens
// import is a bare "@beskid/material-theme" alias only apps' vite configs
// resolve); the @theme inline bridge is taken verbatim from the package.
const entryCss = readFileSync(join(pkgDir, 'src/styles/shadcn-entry.css'), 'utf8')
  .replace(/^@import[^\n]*\n/gm, '');
writeFileSync(join(out, 'shadcn-bridge.css'), entryCss);

const twBin = join(root, '.ds-sync/node_modules/@tailwindcss/cli/dist/index.mjs');
execFileSync(process.execPath, [twBin, '-i', join(out, 'beskid.tw.css'), '-o', join(out, 'beskid.css')], {
  cwd: out, stdio: 'inherit',
});
console.error(`[ds-build] staged ${relative(root, out)} (${mods.length} entry modules)`);
