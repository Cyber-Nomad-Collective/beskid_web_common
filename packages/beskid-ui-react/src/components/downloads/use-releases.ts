"use client";

import { useEffect, useState } from "react";
import type { ReleaseInfo } from "./types";

interface UseReleasesResult {
	releases: ReleaseInfo[];
	loading: boolean;
	error: string | null;
}

const STALE_MS = 5 * 60 * 1000;

let cached: { releases: ReleaseInfo[]; ts: number } | null = null;

export function useReleases(): UseReleasesResult {
	const [releases, setReleases] = useState<ReleaseInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const ac = new AbortController();

		async function fetchReleases() {
			if (cached && Date.now() - cached.ts < STALE_MS) {
				setReleases(cached.releases);
				setLoading(false);
				return;
			}

			try {
				const res = await fetch("/api/releases.json", { signal: ac.signal });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data: ReleaseInfo[] = await res.json();
				cached = { releases: data, ts: Date.now() };
				setReleases(data);
			} catch (err) {
				if (ac.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Failed to fetch releases");
			} finally {
				if (!ac.signal.aborted) setLoading(false);
			}
		}

		fetchReleases();

		return () => ac.abort();
	}, []);

	return { releases, loading, error };
}
