import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { DownloadsSection } from "./DownloadsSection";

afterEach(() => {
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
