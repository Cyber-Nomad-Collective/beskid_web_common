import { validateWorkspace } from "../src/validate-workspace.js";

const workspaceDir = process.argv[2] ?? process.cwd();
const report = validateWorkspace(workspaceDir);

for (const issue of report.issues) {
	console.log(`[${issue.severity}] ${issue.path}: ${issue.message}`);
}
console.log(`Nodes: ${report.nodeCount}, issues: ${report.issues.length}`);
process.exit(report.ok ? 0 : 1);
