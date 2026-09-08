import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { DownloadsSection } from "./DownloadsSection";

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
