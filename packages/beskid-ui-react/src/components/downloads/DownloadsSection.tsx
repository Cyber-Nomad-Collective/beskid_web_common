"use client";

import { useMemo, useState } from "react";
import type { PlatformId, AssetInfo, PackageInfo } from "./types";
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

function getDetectedPlatform(): PlatformId | null {
	if (typeof navigator === "undefined") return null;
	const p = navigator.platform ?? "";
	if (p.includes("Win")) return "windows-amd64";
	if (p.includes("Mac")) return "darwin-arm64";
	if (p.includes("Linux")) return "linux-amd64";
	return null;
}

function copyText(text: string, cb: (value: boolean) => void) {
	void navigator.clipboard.writeText(text).then(
		() => cb(true),
		() => cb(false),
	);
}

export function DownloadsSection({
	initialVersion,
	versionSource,
}: DownloadsSectionProps) {
	const { version, assets, packages, installScript, loading, error } =
		useLatestVersion();
	const { releases, loading: releasesLoading } = useReleases();

	const [activePlatform, setActivePlatform] = useState<PlatformId>(
		getDetectedPlatform() ?? "linux-amd64",
	);
	const [copied, setCopied] = useState(false);

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
			<div className="downloads-block">
				<p className="downloads-hint">Failed to load download data: {error}</p>
				<section className="downloads-block">
					<h2 className="downloads-title downloads-title--section">Changelog</h2>
					{releasesLoading ? (
						<p className="downloads-hint">Loading changelog...</p>
					) : (
						<div className="downloads-platform-rows">
							{releases.map((release) => (
								<article key={release.version} className="downloads-platform-row">
									<div className="downloads-platform-row__main">
										<span className="downloads-platform-row__label">{release.version}</span>
										<span className="downloads-platform-row__cmd">
											{release.date} — {release.title}
										</span>
										{release.changelog ? (
											<span className="downloads-platform-row__cmd">
												{release.changelog}
											</span>
										) : null}
									</div>
								</article>
							))}
						</div>
					)}
				</section>
			</div>
		);
	}

	return (
		<div>
			<section className="downloads-block">
				<div className="downloads-block__header">
					<h1 className="downloads-title">Download</h1>
					<p className="downloads-meta">
						<span className="downloads-meta__version">v{displayVersion}</span>
						{displaySource ? (
							<>
								<span className="downloads-meta__sep">·</span>
								<span className="downloads-meta__channel">{displaySource}</span>
							</>
						) : null}
					</p>
				</div>

				{loading && !version ? (
					<div className="downloads-hint">Loading available installers...</div>
				) : (
					<>
						<div className="downloads-tabs" role="tablist" aria-label="Platform selector">
							{PLATFORMS.map((platform) => {
								const isActive = platform.id === activePlatform;
								return (
									<button
										key={platform.id}
										className="downloads-tab"
										role="tab"
										aria-selected={isActive}
										onClick={() => setActivePlatform(platform.id)}
									>
										{platform.label}
									</button>
								);
							})}
						</div>

						{activeAsset ? (
							<>
								<div className="downloads-command">
									<div className="downloads-command__row">
										<span className="downloads-command__label">
											Copy install command for {installLabel}
										</span>
										<button
											type="button"
											className="downloads-command__copy"
											onClick={() => {
												if (installCommand) {
													copyText(installCommand, (ok) => {
														if (ok) {
															setCopied(true);
															setTimeout(() => setCopied(false), 1400);
														}
													});
												}
											}}
											aria-live="polite"
										>
											{copied ? "Copied" : "Copy"}
										</button>
									</div>
									<pre className="downloads-command__pre">
										<code>{installCommand || "No install command available."}</code>
									</pre>
								</div>

								<div className="downloads-actions">
									<a
										className="downloads-btn downloads-btn--primary"
										href={activeAsset.url}
										download={activeAsset.filename}
									>
										Download {activeAsset.filename}
									</a>
									<a
										className="downloads-btn downloads-btn--secondary"
										href={activeAsset.url}
										rel="noopener noreferrer"
										target="_blank"
									>
										View binary release
									</a>
								</div>

								{activePackages.length > 0 ? (
									<div className="downloads-platform-rows">
										{activePackages.map((pkg: PackageInfo) => (
											<div className="downloads-platform-row" key={pkg.label}>
												<div className="downloads-platform-row__main">
													<span className="downloads-platform-row__label">
														{pkg.label} package
													</span>
													<code className="downloads-platform-row__cmd">
														{pkg.command}
													</code>
												</div>
												<a
													className="downloads-btn downloads-btn--secondary downloads-btn--compact"
													href={pkg.url}
													target="_blank"
													rel="noopener noreferrer"
												>
													View package
												</a>
											</div>
										))}
									</div>
								) : null}
							</>
						) : (
							<p className="downloads-hint">No binary asset available for this platform.</p>
						)}
					</>
				)}
			</section>

			<section className="downloads-block">
				<div className="downloads-block__header">
					<h2 className="downloads-title downloads-title--section">Changelog</h2>
				</div>
				{releasesLoading ? (
					<p className="downloads-hint">Loading changelog...</p>
				) : (
					<div className="downloads-platform-rows">
						{releases.map((release) => (
							<article key={release.version} className="downloads-platform-row">
								<div className="downloads-platform-row__main">
									<span className="downloads-platform-row__label">{release.version}</span>
									<code className="downloads-platform-row__cmd">
										{release.date}
									</code>
									<span className="downloads-platform-row__cmd">{release.title}</span>
									{release.changelog ? (
										<span className="downloads-platform-row__cmd">{release.changelog}</span>
									) : null}
								</div>
								{release.links.length > 0 ? (
									<a
										className="downloads-btn downloads-btn--secondary downloads-btn--compact"
										href={release.links[0].url}
										target="_blank"
										rel="noopener noreferrer"
									>
										{release.links[0].label}
									</a>
								) : null}
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
