import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve installed @beskid/beskid-ui / @cyber-nomad-collective/beskid-ui or monorepo packages/beskid-ui. */
export function resolveBeskidUiRoot() {
	for (const name of ['@beskid/beskid-ui', '@cyber-nomad-collective/beskid-ui']) {
		try {
			return path.dirname(require.resolve(`${name}/package.json`));
		} catch {
			/* try next */
		}
	}
	const monorepo = path.resolve(__dirname, '../../beskid-ui');
	if (fs.existsSync(path.join(monorepo, 'package.json'))) {
		return monorepo;
	}
	throw new Error(
		'beskid-ui not found. Install @cyber-nomad-collective/beskid-ui (or @beskid/beskid-ui alias) next to trudoc.',
	);
}
