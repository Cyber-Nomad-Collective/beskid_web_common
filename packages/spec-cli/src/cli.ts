import fs from "node:fs";
import path from "node:path";
import {
	applyImportAssistant,
	analyzeImportAssistant,
	applyLayoutBoilerplate,
	applyLayoutTemplate,
	createSpecNode,
	importLegacyMdxTree,
	initWorkspace,
	listLayoutTemplates,
	nodeDirFromSlug,
	parseLayoutFile,
	parseNodeDocument,
	parseNodeMetadata,
	parseWorkspaceManifest,
	saveLayoutTemplate,
	migrateWorkspaceToV2,
	syncWorkspaceGeneratedSections,
	seedWorkspace,
	scrubWorkspacePresentation,
	validateWorkspace,
} from "@cyber-nomad-collective/spec-core";
import {
	clearCredentials,
	credentialsPath,
	loadCredentials,
	loginWithDeviceFlow,
	loginWithToken,
} from "./auth.js";
import { pushNodePullRequest } from "./repo.js";
import { servePlatformSpec } from "./serve.js";
import {
	defaultNormativeWorkspaceDir,
	findRepoRoot,
	siteSpecContentPath,
	siteSpecContentReady,
} from "./workspace-paths.js";

function usage(): string {
	return `spec — normative platform-spec workspace

Usage:
  spec init [--dir <path>] [--from-mdx <mdx-root>]
  spec validate [--dir <path>]
  spec migrate v2 [--dir <workspace>]
  spec sync [--dir <workspace>]
  spec new node -t <Type> --slug <slug> [--title <title>] [--parent <slug>] [--dir <workspace>]
  spec node create --path <slug> --level <level> [--title <title>] [--dir <workspace>]
  spec serve [--dir <workspace>] [--port <n>] [--app <platform-spec-dir>]
  spec seed --from <mdx-root> [--dir <workspace>] [--force]
  spec scrub [--dir <workspace>]
  spec import-mdx --from <mdx-root> [--dir <workspace>]
  spec import-assistant --from <legacy-root> [--dir <workspace>] [--analyze-only] [--apply]
  spec auth login [--token <ghp_...>]
  spec auth status
  spec auth logout
  spec repo push --slug <slug> [--branch <name>] [--dir <workspace>]
  spec layout validate --path <node-path> [--dir <workspace>]
  spec layout generate --path <node-path> [--dir <workspace>] [--overwrite]
  spec layout template list|save|apply ...
`;
}

function flag(args: string[], name: string): string | undefined {
	const idx = args.indexOf(name);
	if (idx === -1 || idx + 1 >= args.length) return undefined;
	return args[idx + 1];
}

function hasFlag(args: string[], name: string): boolean {
	return args.includes(name);
}

function resolveWorkspace(args: string[]): string {
	const explicit = flag(args, "--dir");
	if (explicit) return path.resolve(explicit);
	return defaultNormativeWorkspaceDir();
}

function cmdInit(args: string[]): number {
	const workspace = resolveWorkspace(args);
	const manifestPath = path.join(workspace, "spec.json");
	const fromMdx = flag(args, "--from-mdx");

	if (!fs.existsSync(manifestPath)) {
		const root = findRepoRoot();
		if (
			root &&
			!siteSpecContentReady(root) &&
			path.resolve(workspace) === siteSpecContentPath(root)
		) {
			console.error(
				`Missing ${siteSpecContentPath(root)}. Initialize the submodule:\n` +
					`  git submodule update --init site/spec-content`,
			);
			return 1;
		}
		initWorkspace(workspace);
		console.log(`Initialized workspace at ${workspace}`);
	} else {
		console.log(`Workspace already initialized at ${workspace}`);
	}

	if (fromMdx) {
		const result = seedWorkspace({
			workspaceDir: workspace,
			mdxRoot: path.resolve(fromMdx),
			force: true,
		});
		console.log(
			`Imported ${result.imported} nodes from MDX (skipped ${result.skipped})`,
		);
		for (const err of result.errors) console.error(err);
		if (result.errors.length > 0 || !result.validationOk) return 1;
	}

	console.log(`Next: spec validate --dir ${workspace}`);
	return 0;
}

function cmdValidate(args: string[]): number {
	const workspace = resolveWorkspace(args);
	const report = validateWorkspace(workspace);
	for (const issue of report.issues) {
		console.log(`[${issue.severity}] ${issue.path}: ${issue.message}`);
	}
	console.log(`Nodes: ${report.nodeCount}, issues: ${report.issues.length}`);
	return report.ok ? 0 : 1;
}

async function cmdAuth(args: string[]): Promise<number> {
	const sub = args[1];
	if (sub === "login") {
		const token = flag(args, "--token");
		const credentials = token
			? await loginWithToken(token)
			: await loginWithDeviceFlow();
		console.log(`Authenticated as ${credentials.login}`);
		console.log(`Credentials stored at ${credentialsPath()}`);
		return 0;
	}
	if (sub === "status") {
		const credentials = loadCredentials();
		if (!credentials) {
			console.log("Not authenticated");
			return 1;
		}
		console.log(`GitHub: ${credentials.login} (${credentials.createdAt})`);
		return 0;
	}
	if (sub === "logout") {
		clearCredentials();
		console.log("Cleared stored credentials");
		return 0;
	}
	console.error("Usage: spec auth login|status|logout");
	return 1;
}

async function cmdRepo(args: string[]): Promise<number> {
	if (args[1] !== "push") {
		console.error("Usage: spec repo push --slug <slug>");
		return 1;
	}
	const slug = flag(args, "--slug");
	if (!slug) {
		console.error("Missing --slug");
		return 1;
	}
	const result = await pushNodePullRequest({
		workspaceDir: resolveWorkspace(args),
		slug,
		branch: flag(args, "--branch"),
		title: flag(args, "--title"),
		body: flag(args, "--body"),
	});
	console.log(`Opened PR #${result.prNumber}: ${result.prUrl}`);
	return 0;
}

async function cmdServe(args: string[]): Promise<number> {
	const workspace = resolveWorkspace(args);
	const port = Number(flag(args, "--port") ?? "8460");
	return servePlatformSpec({
		workspaceDir: workspace,
		port,
		platformSpecDir: flag(args, "--app"),
	});
}

function cmdNewNode(args: string[]): number {
	const typeFlag = flag(args, "-t") ?? flag(args, "--type");
	const slug = flag(args, "--slug") ?? flag(args, "--path");
	if (!typeFlag || !slug) {
		console.error("Usage: spec new node -t <Type> --slug <slug>");
		return 1;
	}
	const workspace = resolveWorkspace(args);
	const manifestPath = path.join(workspace, "spec.json");
	if (!fs.existsSync(manifestPath)) {
		initWorkspace(workspace);
	}
	const result = createSpecNode({
		workspaceDir: workspace,
		typeFlag,
		slug,
		title: flag(args, "--title"),
		parentSlug: flag(args, "--parent"),
		status: flag(args, "--status") ?? "draft",
	});
	const manifest = parseWorkspaceManifest(
		JSON.parse(fs.readFileSync(path.join(workspace, "spec.json"), "utf8")),
	);
	applyLayoutBoilerplate({
		nodeDir: result.nodeDir,
		manifest,
		node: result.node,
	});
	console.log(`Created ${result.level} node at ${result.nodeDir}`);
	return 0;
}

function cmdImportAssistant(args: string[]): number {
	const from = flag(args, "--from");
	if (!from) {
		console.error("Missing --from <legacy-root>");
		return 1;
	}
	const workspace = resolveWorkspace(args);
	const manifestPath = path.join(workspace, "spec.json");
	if (!fs.existsSync(manifestPath)) {
		initWorkspace(workspace);
	}
	const manifest = parseWorkspaceManifest(
		JSON.parse(fs.readFileSync(manifestPath, "utf8")),
	);

	if (hasFlag(args, "--analyze-only")) {
		const report = analyzeImportAssistant({
			legacyRoot: path.resolve(from),
			workspaceDir: workspace,
			manifest,
		});
		console.log(
			`Found ${report.mdxFiles} MDX, ${report.mdFiles} MD, ${report.nodeDirs} node dirs`,
		);
		for (const item of report.plan) {
			console.log(
				`[${item.action}] ${item.sourcePath} -> ${item.targetSlug}${item.reason ? ` (${item.reason})` : ""}`,
			);
		}
		return 0;
	}

	const report = applyImportAssistant({
		legacyRoot: path.resolve(from),
		workspaceDir: workspace,
		manifest,
		dryRun: !hasFlag(args, "--apply"),
	});
	console.log(`Plan items: ${report.plan.length}, errors: ${report.errors.length}`);
	for (const err of report.errors) console.error(err);
	return report.errors.length > 0 ? 1 : 0;
}

function cmdScrub(args: string[]): number {
	const workspace = resolveWorkspace(args);
	const manifestPath = path.join(workspace, "spec.json");
	if (!fs.existsSync(manifestPath)) {
		console.error(`Workspace not found: ${workspace}`);
		return 1;
	}
	const manifest = parseWorkspaceManifest(
		JSON.parse(fs.readFileSync(manifestPath, "utf8")),
		manifestPath,
	);
	const result = scrubWorkspacePresentation(workspace, manifest);
	console.log(
		`Scrubbed presentation surface from ${result.scrubbed} nodes (${result.unchanged} unchanged)`,
	);
	return 0;
}

function cmdMigrateV2(args: string[]): number {
	const workspace = resolveWorkspace(args);
	const result = migrateWorkspaceToV2(workspace);
	console.log(
		`Migrated ${result.migrated} nodes (removed node.json from ${result.removedNodeJson} nodes, deleted content.json from ${result.removedContentJson} nodes).`,
	);
	for (const err of result.errors) console.error(err);
	return result.errors.length > 0 ? 1 : 0;
}

function cmdSync(args: string[]): number {
	const workspace = resolveWorkspace(args);
	const result = syncWorkspaceGeneratedSections(workspace);
	console.log(
		`Synced generated hub sections for ${result.synced} nodes (${result.unchanged} unchanged).`,
	);
	for (const err of result.errors) console.error(err);
	return result.errors.length > 0 ? 1 : 0;
}

function cmdSeed(args: string[]): number {
	const from = flag(args, "--from");
	if (!from) {
		console.error("Missing --from <mdx-root>");
		return 1;
	}
	const workspace = resolveWorkspace(args);
	const manifestPath = path.join(workspace, "spec.json");
	if (!fs.existsSync(manifestPath)) {
		initWorkspace(workspace);
	}
	const result = seedWorkspace({
		workspaceDir: workspace,
		mdxRoot: path.resolve(from),
		force: hasFlag(args, "--force"),
	});
	if (result.seeded) {
		console.log(
			`Seeded workspace (checksum ${result.checksum.slice(0, 12)}…): imported ${result.imported}, skipped ${result.skipped}`,
		);
	} else {
		console.log(`Seed skipped — checksum unchanged (${result.checksum.slice(0, 12)}…)`);
	}
	for (const err of result.errors) console.error(err);
	return result.errors.length > 0 || !result.validationOk ? 1 : 0;
}

function cmdLayoutGenerate(args: string[]): number {
	const nodePath = flag(args, "--path");
	if (!nodePath) {
		console.error("Missing --path");
		return 1;
	}
	const workspace = resolveWorkspace(args);
	const nodeDir = resolveNodeDir(workspace, nodePath);
	const manifest = parseWorkspaceManifest(
		JSON.parse(fs.readFileSync(path.join(workspace, "spec.json"), "utf8")),
	);
	const doc = parseNodeDocument({ nodeDir, workspaceDir: workspace, manifest });
	const result = applyLayoutBoilerplate({
		nodeDir,
		manifest,
		node: doc.node,
		overwrite: hasFlag(args, "--overwrite"),
	});
	console.log(
		result.created
			? `Generated content.md with sections: ${result.sections.join(", ")}`
			: `content.md already exists (${result.sections.join(", ")})`,
	);
	return 0;
}

function cmdImportMdx(args: string[]): number {
	const from = flag(args, "--from");
	if (!from) {
		console.error("Missing --from <mdx-root>");
		return 1;
	}
	const workspace = resolveWorkspace(args);
	const manifestPath = path.join(workspace, "spec.json");
	if (!fs.existsSync(manifestPath)) {
		initWorkspace(workspace);
	}
	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	const result = importLegacyMdxTree({
		mdxRoot: path.resolve(from),
		outputRoot: workspace,
		manifest,
	});
	const scrub = scrubWorkspacePresentation(workspace, manifest);
	console.log(`Imported: ${result.imported}, skipped: ${result.skipped}`);
	console.log(
		`Scrubbed presentation surface from ${scrub.scrubbed} nodes (${scrub.unchanged} unchanged)`,
	);
	for (const err of result.errors) console.error(err);
	return result.errors.length > 0 ? 1 : 0;
}

function cmdNodeCreate(args: string[]): number {
	const slug = flag(args, "--path");
	const level = flag(args, "--level");
	if (!slug || !level) {
		console.error("Usage: spec node create --path <slug> --level <level>");
		return 1;
	}
	return cmdNewNode([
		"new",
		"node",
		"-t",
		level,
		"--slug",
		slug,
		...args.filter((arg) => arg !== "node" && arg !== "create"),
	]);
}

function resolveNodeDir(workspace: string, nodePath: string): string {
	const manifest = JSON.parse(
		fs.readFileSync(path.join(workspace, "spec.json"), "utf8"),
	);
	if (path.isAbsolute(nodePath)) return nodePath;
	const slug = nodePath.startsWith("platform-spec/")
		? nodePath
		: `platform-spec/${nodePath}`;
	return path.join(workspace, nodeDirFromSlug(manifest.contentRoot, slug));
}

function cmdLayoutValidate(args: string[]): number {
	const nodePath = flag(args, "--path");
	if (!nodePath) {
		console.error("Missing --path");
		return 1;
	}
	const workspace = resolveWorkspace(args);
	const nodeDir = resolveNodeDir(workspace, nodePath);
	const layoutPath = path.join(nodeDir, "layout.json");
	if (!fs.existsSync(layoutPath)) {
		console.error(`Missing ${layoutPath}`);
		return 1;
	}
	const manifest = parseWorkspaceManifest(
		JSON.parse(fs.readFileSync(path.join(workspace, "spec.json"), "utf8")),
		path.join(workspace, "spec.json"),
	);
	const doc = parseNodeDocument({ nodeDir, workspaceDir: workspace, manifest });
	parseLayoutFile(JSON.parse(fs.readFileSync(layoutPath, "utf8")), layoutPath);
	console.log(`Layout valid for ${doc.node.slug}`);
	return 0;
}

function cmdLayoutTemplate(args: string[], sub: string): number {
	const workspace = resolveWorkspace(args);

	if (sub === "list") {
		for (const name of listLayoutTemplates(workspace)) console.log(name);
		return 0;
	}

	const name = flag(args, "--name");
	const nodePath = flag(args, "--path");
	if (!name || !nodePath) {
		console.error("Requires --name and --path");
		return 1;
	}
	const nodeDir = resolveNodeDir(workspace, nodePath);
	const layoutPath = path.join(nodeDir, "layout.json");

	if (sub === "save") {
		const layout = parseLayoutFile(
			JSON.parse(fs.readFileSync(layoutPath, "utf8")),
			layoutPath,
		);
		const file = saveLayoutTemplate(workspace, name, layout);
		console.log(`Saved template to ${file}`);
		return 0;
	}

	if (sub === "apply") {
		applyLayoutTemplate(workspace, name, layoutPath);
		console.log(`Applied template ${name} to ${layoutPath}`);
		return 0;
	}

	return 1;
}

export async function runCli(argv: string[]): Promise<number> {
	const args = argv.slice(2);
	const cmd = args[0];

	if (!cmd || cmd === "--help" || cmd === "-h") {
		console.log(usage());
		return 0;
	}

	switch (cmd) {
		case "init":
			return cmdInit(args);
		case "validate":
			return cmdValidate(args);
		case "new":
			if (args[1] === "node") return cmdNewNode(args);
			break;
		case "serve":
			return cmdServe(args);
		case "auth":
			return cmdAuth(args);
		case "repo":
			return cmdRepo(args);
		case "import-assistant":
			return cmdImportAssistant(args);
		case "seed":
			return cmdSeed(args);
		case "scrub":
			return cmdScrub(args);
		case "migrate":
			if (args[1] === "v2") return cmdMigrateV2(args);
			break;
		case "sync":
			return cmdSync(args);
		case "import-mdx":
			return cmdImportMdx(args);
		case "node":
			if (args[1] === "create") return cmdNodeCreate(args);
			break;
		case "layout":
			if (args[1] === "validate") return cmdLayoutValidate(args);
			if (args[1] === "generate") return cmdLayoutGenerate(args);
			if (args[1] === "template") return cmdLayoutTemplate(args, args[2] ?? "");
			break;
	}

	console.log(usage());
	return 1;
}

if (import.meta.main) {
	runCli(process.argv)
		.then((code) => process.exit(code))
		.catch((err) => {
			console.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		});
}
