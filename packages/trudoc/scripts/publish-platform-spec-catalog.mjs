/**
 * Publish tracker-facing platform-spec JSON from src/generated to public/generated.
 * Catalog + per-document bundles are committed under src/generated; this mirrors them
 * for static hosting at /generated/platform-spec-catalog.json and .../platform-spec-docs/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getWebsiteRoot } from './lib/website-root.mjs';

const WEBSITE_ROOT = getWebsiteRoot(import.meta.url);
const SRC_GENERATED = path.join(WEBSITE_ROOT, 'src', 'generated');
const PUBLIC_GENERATED = path.join(WEBSITE_ROOT, 'public', 'generated');

const CATALOG_SRC = path.join(SRC_GENERATED, 'platform-spec-catalog.json');
const DOCS_SRC = path.join(SRC_GENERATED, 'platform-spec-docs');
const CATALOG_PUBLIC = path.join(PUBLIC_GENERATED, 'platform-spec-catalog.json');
const DOCS_PUBLIC = path.join(PUBLIC_GENERATED, 'platform-spec-docs');

function copyFile(src, dest) {
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
	if (!fs.existsSync(src)) {
		console.error(`publish-platform-spec-catalog: missing ${src}`);
		process.exit(1);
	}
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.cpSync(src, dest, { recursive: true });
}

if (!fs.existsSync(CATALOG_SRC)) {
	console.error(
		`publish-platform-spec-catalog: missing ${path.relative(WEBSITE_ROOT, CATALOG_SRC)} — regenerate platform-spec catalog in src/generated first`,
	);
	process.exit(1);
}

copyFile(CATALOG_SRC, CATALOG_PUBLIC);
console.log(`Wrote ${path.relative(WEBSITE_ROOT, CATALOG_PUBLIC)}`);

if (fs.existsSync(DOCS_SRC)) {
	copyDir(DOCS_SRC, DOCS_PUBLIC);
	const count = fs.readdirSync(DOCS_SRC).filter((n) => n.endsWith('.json')).length;
	console.log(
		`Wrote ${path.relative(WEBSITE_ROOT, DOCS_PUBLIC)} (${count} document bundles)`,
	);
} else {
	console.warn(
		`publish-platform-spec-catalog: no ${path.relative(WEBSITE_ROOT, DOCS_SRC)} — catalog index only`,
	);
}
