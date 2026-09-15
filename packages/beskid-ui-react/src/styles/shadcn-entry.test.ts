import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(resolve("src/styles/shadcn-entry.css"), "utf8");

describe("shared shadcn Tailwind theme bridge", () => {
	it("exports the complete semantic color, radius, and sidebar mapping", () => {
		const expectedTokens = [
			"--color-background",
			"--color-foreground",
			"--color-card",
			"--color-card-foreground",
			"--color-popover",
			"--color-popover-foreground",
			"--color-primary",
			"--color-primary-foreground",
			"--color-secondary",
			"--color-secondary-foreground",
			"--color-muted",
			"--color-muted-foreground",
			"--color-accent",
			"--color-accent-foreground",
			"--color-destructive",
			"--color-destructive-foreground",
			"--color-border",
			"--color-input",
			"--color-ring",
			"--color-chart-1",
			"--color-chart-2",
			"--color-chart-3",
			"--color-chart-4",
			"--color-chart-5",
			"--radius-sm",
			"--radius-md",
			"--radius-lg",
			"--radius-xl",
			"--radius-4xl",
			"--color-sidebar",
			"--color-sidebar-foreground",
			"--color-sidebar-primary",
			"--color-sidebar-primary-foreground",
			"--color-sidebar-accent",
			"--color-sidebar-accent-foreground",
			"--color-sidebar-border",
			"--color-sidebar-ring",
		];

		for (const token of expectedTokens) {
			expect(stylesheet, `missing ${token}`).toContain(`${token}:`);
		}
	});
});
