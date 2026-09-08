import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const stylesheet = new URL('../src/styles/landing.css', import.meta.url);

async function landingStyles() {
	return readFile(fileURLToPath(stylesheet), 'utf8');
}

test('hero code viewport is fixed-height and scrollable', async () => {
	const css = await landingStyles();

	assert.match(
		css,
		/\.landing-hero__code \.landing-terminal__body\s*\{[^}]*block-size:\s*clamp\([^}]*overflow:\s*auto/s,
	);
});

test('hero file selectors are editor tabs instead of standalone buttons', async () => {
	const css = await landingStyles();

	assert.match(css, /\.landing-terminal--tabs \.landing-terminal__head\s*\{[^}]*align-items:\s*flex-end/s);
	assert.match(css, /\.landing-terminal__tab--active\s*\{[^}]*background:\s*var\(--landing-code-bg\)/s);
});

test('dark landing terminals use Shiki dark token colors', async () => {
	const css = await landingStyles();

	assert.match(css, /html:not\(\[data-theme='light'\]\) \.landing-terminal \[style\*='--shiki-dark'\]\s*\{[^}]*color:\s*var\(--shiki-dark\)\s*!important/s);
});
