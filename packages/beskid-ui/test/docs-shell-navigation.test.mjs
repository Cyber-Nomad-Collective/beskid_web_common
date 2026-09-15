import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const header = readFileSync(new URL('../src/starlight/Header.astro', import.meta.url), 'utf8');
const docsRail = readFileSync(new URL('../src/docs/DocsNavChrome.astro', import.meta.url), 'utf8');
const sidebar = readFileSync(new URL('../src/starlight/Sidebar.astro', import.meta.url), 'utf8');

test('documentation pages use the dedicated searchable navigation rail', () => {
	assert.match(header, /isDocs && <DocsNavChrome currentPath=\{path\} navigation=\{docsNavigation\}/);
	assert.match(docsRail, /<aside[^>]*id="docs-nav-rail"[^>]*aria-label="Docs contents"/);
	assert.match(docsRail, /<Search \/>/);
	assert.match(docsRail, /data-docs-nav-filter/);
	assert.match(docsRail, /navigationItems\.map/);
	assert.match(docsRail, /aria-current=\{isCurrent\(item\.link\) \? 'page' : undefined\}/);
	assert.doesNotMatch(sidebar, /<TableOfContents|<nav|<aside/);
});

test('desktop navigation groups documentation links under a Learn menu', () => {
	assert.match(header, /<summary[^>]*>\s*Learn/);
	assert.match(header, /href="\/docs\/"/);
	assert.match(header, /href=\{standardHref\}/);
	assert.match(header, /href="\/book\/"/);
	assert.match(header, /right: 0/);
});
