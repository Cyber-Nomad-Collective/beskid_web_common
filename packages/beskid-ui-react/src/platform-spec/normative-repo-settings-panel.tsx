"use client";

import { useState } from "react";

export interface NormativeRepoSettingsPanelProps {
	initialRepoUrl: string;
	defaultRepoUrl: string;
	source: "env" | "stored" | "default";
	canEdit: boolean;
	onSave: (repoUrl: string) => Promise<void>;
}

export function NormativeRepoSettingsPanel({
	initialRepoUrl,
	defaultRepoUrl,
	source,
	canEdit,
	onSave,
}: NormativeRepoSettingsPanelProps) {
	const [repoUrl, setRepoUrl] = useState(initialRepoUrl);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function handleSave() {
		setBusy(true);
		setMessage(null);
		try {
			await onSave(repoUrl.trim());
			setMessage("Saved normative spec repository link.");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Save failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="space-y-3 rounded-lg border p-4">
			<div>
				<h2 className="font-medium">Normative spec repository</h2>
				<p className="text-sm text-muted-foreground">
					GitHub repository for JSON/markdown spec sync and draft PRs. Default:{" "}
					<code className="text-xs">{defaultRepoUrl}</code>
				</p>
				<p className="text-xs text-muted-foreground">
					Active source: <strong>{source}</strong>
					{source === "env" ? " (SPEC_GIT_REPO_URL env overrides UI)" : null}
				</p>
			</div>
			<label className="grid gap-1 text-sm">
				<span>Repository URL</span>
				<input
					className="rounded-md border px-3 py-2 font-mono text-xs"
					value={repoUrl}
					onChange={(event) => setRepoUrl(event.target.value)}
					disabled={!canEdit || source === "env"}
				/>
			</label>
			{canEdit && source !== "env" ? (
				<button
					type="button"
					className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
					disabled={busy}
					onClick={() => void handleSave()}
				>
					{busy ? "Saving…" : "Save repository link"}
				</button>
			) : null}
			{message ? <p className="text-sm">{message}</p> : null}
		</section>
	);
}
