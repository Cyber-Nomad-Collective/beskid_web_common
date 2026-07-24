"use client";

import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { BadgeDialog } from "./BadgeDialog";
import { ChangelogList } from "./ChangelogList";
import { DownloadCard } from "./DownloadCard";
import { PlatformTabs } from "./PlatformTabs";
import type { AssetInfo, PackageInfo, PlatformId } from "./types";
import { useLatestVersion } from "./use-latest-version";
import { useReleases } from "./use-releases";

interface DownloadsSectionProps {
	initialVersion?: string;
	versionSource?: string;
}

const PLATFORMS: { id: PlatformId; label: string }[] = [
	{ id: "linux-amd64", label: "Linux (amd64)" },
	{ id: "darwin-arm64", label: "macOS (ARM64)" },
	{ id: "windows-amd64", label: "Windows (amd64)" },
];

export function DownloadsSection({
	initialVersion,
	versionSource,
}: DownloadsSectionProps) {
	const { version, assets, packages, installScript, loading, error } =
		useLatestVersion();
	const { releases, loading: releasesLoading } = useReleases();

	const [activePlatform, setActivePlatform] =
		useState<PlatformId>("linux-amd64");

	const displayVersion = version ?? initialVersion ?? "...";
	const displaySource = versionSource ?? "";

	const activeAsset = useMemo<AssetInfo | undefined>(() => {
		if (assets.length === 0) return undefined;
		return assets.find(
			(a) =>
				a.platform === activePlatform ||
				`${a.platform}-${a.arch}` === activePlatform,
		);
	}, [assets, activePlatform]);

	const activePackages = useMemo<PackageInfo[]>(
		() => packages.filter((p) => p.platform === activePlatform),
		[packages, activePlatform],
	);

	const installCommand = useMemo(() => {
		if (!installScript) return "";
		if (activePlatform === "windows-amd64") return installScript.ps;
		return installScript.sh;
	}, [installScript, activePlatform]);

	const installLabel = useMemo(() => {
		if (activePlatform === "windows-amd64") return "PowerShell";
		return "Shell";
	}, [activePlatform]);

	if (error) {
		return (
			<div className="flex flex-col gap-6">
				<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
					Failed to load download data: {error}
				</div>
				<ChangelogList releases={releases} loading={releasesLoading} />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Version header */}
			<div className="flex items-center gap-3 flex-wrap">
				<Badge variant="default" className="text-sm px-3 py-1">
					v{displayVersion}
				</Badge>
				{displaySource && (
					<span className="text-xs text-muted-foreground">
						source: {displaySource}
					</span>
				)}
				<BadgeDialog version={displayVersion} platforms={PLATFORMS} />
			</div>

			{/* Platform tabs */}
			{loading && !version ? (
				<div className="animate-pulse flex gap-1">
					{PLATFORMS.map((p) => (
						<div key={p.id} className="h-9 w-28 rounded bg-muted" />
					))}
				</div>
			) : (
				<PlatformTabs
					platforms={PLATFORMS}
					active={activePlatform}
					onSelect={setActivePlatform}
				/>
			)}

			{/* Download card */}
			{loading && !version ? (
				<div className="animate-pulse space-y-3">
					<div className="h-32 rounded-xl bg-muted" />
				</div>
			) : activeAsset ? (
				<DownloadCard
					asset={activeAsset}
					packages={activePackages}
					installCommand={installCommand}
					installLabel={installLabel}
					active
				/>
			) : (
				<p className="text-sm text-muted-foreground">
					No binary asset available for this platform.
				</p>
			)}

			{/* Changelog */}
			<div className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">Changelog</h2>
				<ChangelogList releases={releases} loading={releasesLoading} />
			</div>
		</div>
	);
}
