import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { DownloadsSection } from "./DownloadsSection";
import type { PinnedDownloadRelease, PlatformId } from "./types";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

test("reports a partial version payload instead of crashing", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			return new Response(
				JSON.stringify(url.includes("releases.json") ? [] : { error: "release unavailable" }),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}),
	);

	render(<DownloadsSection initialVersion="0.4.607-unstable" />);

	const message = await screen.findByText(/Failed to load download data:/);
	expect(message.textContent).toContain("Invalid version payload");
});

test("rejects broad OS labels that do not identify one selectable platform", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			return new Response(
				JSON.stringify(
					url.includes("releases.json")
						? []
						: {
								version: "0.4.607-unstable",
								source: "github:unstable",
								assets: [
									{ platform: "linux", arch: "amd64", kind: "binary", url: "https://example.test/beskid-linux-amd64", filename: "beskid-linux-amd64" },
								],
								packages: [],
								installScript: { sh: "install-sh", ps: "install-ps" },
								containerImages: { base: "base", runner: "runner" },
							},
				),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}),
	);

	render(<DownloadsSection />);

	const message = await screen.findByText(/Failed to load download data:/);
	expect(message.textContent).toContain("Invalid version payload");
});

test("rejects legacy arch fields even with an exact platform identifier", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			return new Response(
				JSON.stringify(
					url.includes("releases.json")
						? []
						: {
								version: "0.4.607-unstable",
								source: "github:unstable",
								assets: [
									{
										platform: "linux-amd64",
										arch: "amd64",
										kind: "binary",
										url: "https://example.test/beskid-linux-amd64",
										filename: "beskid-linux-amd64",
									},
								],
								packages: [],
								installScript: { sh: "install-sh", ps: "install-ps" },
								containerImages: { base: "base", runner: "runner" },
							},
				),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}),
	);

	render(<DownloadsSection />);

	const message = await screen.findByText(/Failed to load download data:/);
	expect(message.textContent).toContain("Invalid version payload");
});

test("shows each release asset and package only in its exact platform tab", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			return new Response(
				JSON.stringify(
					url.includes("releases.json")
						? []
						: {
								version: "0.4.607-unstable",
								source: "github:unstable",
								assets: [
									{ platform: "linux-amd64", kind: "binary", url: "https://example.test/beskid-linux-amd64", filename: "beskid-linux-amd64" },
									{ platform: "windows-amd64", kind: "binary", url: "https://example.test/beskid-windows-amd64.exe", filename: "beskid-windows-amd64.exe" },
								],
								packages: [
									{ platform: "linux-amd64", label: "Debian", command: "apt install ./beskid.deb", url: "https://example.test/beskid.deb" },
									{ platform: "darwin-arm64", label: "DMG", command: "open beskid.dmg", url: "https://example.test/beskid.dmg" },
									{ platform: "windows-amd64", label: "MSI", command: "msiexec /i beskid.msi", url: "https://example.test/beskid.msi" },
								],
								installScript: { sh: "install-sh", ps: "install-ps" },
								containerImages: { base: "base", runner: "runner" },
							},
				),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}),
	);

	render(<DownloadsSection />);

	expect(await screen.findByRole("link", { name: "Download beskid-linux-amd64" })).toBeTruthy();
	expect(screen.getByText("Debian package")).toBeTruthy();
	expect(screen.queryByText("DMG package")).toBeNull();
	expect(screen.getByText("Unstable channel")).toBeTruthy();
	expect(screen.getByText("cli-v0.4.607-unstable")).toBeTruthy();
	expect(screen.getByText("~/.beskid/bin/beskid")).toBeTruthy();
	expect(screen.getByText("rm -f ~/.beskid/bin/beskid")).toBeTruthy();
	expect(screen.getByText("code --install-extension beskid.beskid-vscode")).toBeTruthy();

	fireEvent.click(screen.getByRole("tab", { name: "macOS (ARM64)" }));
	expect(screen.getByText("No binary asset available for this platform.")).toBeTruthy();
	expect(screen.getByText("DMG package")).toBeTruthy();
	expect(screen.queryByText("Debian package")).toBeNull();

	fireEvent.click(screen.getByRole("tab", { name: "Windows (amd64)" }));
	expect(screen.getByRole("link", { name: "Download beskid-windows-amd64.exe" })).toBeTruthy();
	expect(screen.getByText("MSI package")).toBeTruthy();
	expect(screen.queryByText("DMG package")).toBeNull();
});

test("keeps the platform tabs and copy action for a pinned release", async () => {
	const fetchReleaseHistory = vi.fn(async (_url: string) => new Response("[]"));
	const writeText = vi.fn(async () => undefined);
	vi.stubGlobal("fetch", fetchReleaseHistory);
	vi.stubGlobal("navigator", { platform: "Linux", clipboard: { writeText } });

	const base = "https://example.test/releases/download/v0.7.0";
	const platforms = ["linux-amd64", "darwin-arm64", "windows-amd64"] as const;
	const install = (platform: PlatformId) => ({
		installCommand: `extract ${platform}.tar.gz`,
		installLocation: `./${platform}/bin/beskid`,
		editor: { filename: `${platform}.vsix`, url: `${base}/${platform}.vsix` },
	});
	const pinnedRelease: PinnedDownloadRelease = {
		version: "0.7.0",
		source: "github:stable",
		tag: "v0.7.0",
		url: "https://example.test/releases/tag/v0.7.0",
		checksumsUrl: `${base}/SHA256SUMS`,
		assets: platforms.map((platform) => ({
			platform,
			kind: "binary",
			filename: `${platform}.tar.gz`,
			url: `${base}/${platform}.tar.gz`,
		})),
		packages: [
			{ platform: "linux-amd64", label: "Debian", command: "apt install ./beskid.deb", url: `${base}/beskid.deb` },
			{ platform: "darwin-arm64", label: "DMG", command: "Open the disk image", url: `${base}/beskid.dmg` },
			{ platform: "windows-amd64", label: "MSI", command: "msiexec /i beskid.msi", url: `${base}/beskid.msi` },
		],
		platforms: {
			"linux-amd64": install("linux-amd64"),
			"darwin-arm64": install("darwin-arm64"),
			"windows-amd64": install("windows-amd64"),
		},
	};

	render(<DownloadsSection pinnedRelease={pinnedRelease} />);

	expect(screen.getByText("Immutable pin").nextElementSibling?.textContent).toBe("v0.7.0");
	expect(screen.getByRole("link", { name: "View binary release" }).getAttribute("href")).toBe(pinnedRelease.url);
	expect(screen.getByRole("link", { name: "SHA-256 checksums" }).getAttribute("href")).toBe(pinnedRelease.checksumsUrl);
	expect(screen.getByRole("link", { name: "View package" }).getAttribute("href")).toBe(`${base}/beskid.deb`);

	fireEvent.click(screen.getByRole("tab", { name: "macOS (ARM64)" }));
	expect(screen.getByRole("link", { name: "View package" }).getAttribute("href")).toBe(`${base}/beskid.dmg`);

	fireEvent.click(screen.getByRole("tab", { name: "Windows (amd64)" }));
	expect(screen.getByRole("link", { name: "Download windows-amd64.tar.gz" }).getAttribute("href")).toBe(`${base}/windows-amd64.tar.gz`);
	expect(screen.getByRole("link", { name: "View package" }).getAttribute("href")).toBe(`${base}/beskid.msi`);
	expect(screen.getByRole("link", { name: "Download VSIX" }).getAttribute("href")).toBe(`${base}/windows-amd64.vsix`);

	fireEvent.click(screen.getByRole("button", { name: "Copy" }));
	expect(writeText).toHaveBeenCalledWith("extract windows-amd64.tar.gz");
	await screen.findByRole("button", { name: "Copied" });
	expect(fetchReleaseHistory.mock.calls.every(([url]) => url === "/api/releases.json")).toBe(true);
});
