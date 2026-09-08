import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const header = readFileSync(new URL('../src/starlight/Header.astro', import.meta.url), 'utf8');
const sidebar = readFileSync(new URL('../src/starlight/Sidebar.astro', import.meta.url), 'utf8');

test('documentation pages render their table of contents in the left pane', () => {
	assert.match(sidebar, /virtual:starlight\/components\/TableOfContents/);
	assert.match(sidebar, /const isDocsPage = path\.startsWith\('\/docs\/'\)/);
	assert.match(sidebar, /<TableOfContents \/>/);
	assert.match(sidebar, /\.right-sidebar-container/);
});

test('desktop navigation groups documentation links under a Docs menu', () => {
	assert.match(header, /<summary[^>]*>\s*Docs/);
	assert.match(header, /href="\/docs\/"/);
	assert.match(header, /href=\{standardHref\}/);
	assert.match(header, /href="\/book\/"/);
	assert.match(header, /href="https:\/\/learn\.beskid-lang\.org\/"/);
});
