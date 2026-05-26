import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve installed @beskid/docs-ui / @cyber-nomad-collective/docs-ui or monorepo packages/docs-ui. */
export function resolveDocsUiRoot() {
	for (const name of ['@beskid/docs-ui', '@cyber-nomad-collective/docs-ui']) {
		try {
			return path.dirname(require.resolve(`${name}/package.json`));
		} catch {
			/* try next */
		}
	}
	const monorepo = path.resolve(__dirname, '../../docs-ui');
	if (fs.existsSync(path.join(monorepo, 'package.json'))) {
		return monorepo;
	}
	throw new Error(
		'docs-ui not found. Install @cyber-nomad-collective/docs-ui (or @beskid/docs-ui alias) next to trudoc.',
	);
}
