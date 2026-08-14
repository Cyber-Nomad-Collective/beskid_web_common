"use client";

import { useEffect, useState } from "react";
import type { VersionPayload } from "./types";

interface UseLatestVersionResult {
	version: string | null;
	assets: VersionPayload["assets"];
	packages: VersionPayload["packages"];
	installScript: VersionPayload["installScript"] | null;
	containerImages: VersionPayload["containerImages"] | null;
	source: string | null;
	loading: boolean;
	error: string | null;
}

const STALE_MS = 5 * 60 * 1000; // 5 minutes

let cached: { payload: VersionPayload; ts: number } | null = null;

function isVersionPayload(value: unknown): value is VersionPayload {
	if (!value || typeof value !== "object") return false;
	const payload = value as Partial<VersionPayload>;
	return (
		typeof payload.version === "string" &&
		typeof payload.source === "string" &&
		Array.isArray(payload.assets) &&
		Array.isArray(payload.packages) &&
		!!payload.installScript &&
		typeof payload.installScript.sh === "string" &&
		typeof payload.installScript.ps === "string"
	);
}

export function useLatestVersion(): UseLatestVersionResult {
	const [version, setVersion] = useState<string | null>(null);
	const [assets, setAssets] = useState<VersionPayload["assets"]>([]);
	const [packages, setPackages] = useState<VersionPayload["packages"]>([]);
	const [installScript, setInstallScript] = useState<
		VersionPayload["installScript"] | null
	>(null);
	const [containerImages, setContainerImages] = useState<
		VersionPayload["containerImages"] | null
	>(null);
	const [source, setSource] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const ac = new AbortController();

		async function fetchVersion() {
			if (cached && Date.now() - cached.ts < STALE_MS) {
				applyPayload(cached.payload);
				setLoading(false);
				return;
			}

			try {
				const res = await fetch("/api/version.json", { signal: ac.signal });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const payload: unknown = await res.json();
				if (!isVersionPayload(payload)) throw new Error("Invalid version payload");
				cached = { payload, ts: Date.now() };
				applyPayload(payload);
			} catch (err) {
				if (ac.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Failed to fetch version");
			} finally {
				if (!ac.signal.aborted) setLoading(false);
			}
		}

		function applyPayload(p: VersionPayload) {
			setVersion(p.version);
			setAssets(p.assets);
			setPackages(p.packages);
			setInstallScript(p.installScript);
			setContainerImages(p.containerImages);
			setSource(p.source);
		}

		fetchVersion();

		return () => ac.abort();
	}, []);

	return {
		version,
		assets,
		packages,
		installScript,
		containerImages,
		source,
		loading,
		error,
	};
}
