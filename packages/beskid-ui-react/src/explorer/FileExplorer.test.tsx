import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileExplorer } from "./FileExplorer.js";
import type { FileEntry } from "./types.js";

const fixtureEntries: FileEntry[] = [
	{
		path: "src",
		kind: "dir",
		name: "src",
		children: [
			{ path: "src/main.bs", kind: "file", name: "main.bs" },
			{ path: "src/lib.bs", kind: "file", name: "lib.bs" },
		],
	},
	{ path: "Project.bproj", kind: "file", name: "Project.bproj" },
	{ path: "workspace.bws", kind: "file", name: "workspace.bws" },
];

/** Returns the treeitem button for the given entry name. */
function getTreeItemButton(name: string): HTMLElement {
	const items = screen.getAllByRole("treeitem");
	for (const item of items) {
		const btn = item.querySelector("button");
		if (btn?.textContent?.trim() === name) return btn;
	}
	throw new Error(`Tree item "${name}" not found`);
}

afterEach(() => { cleanup(); });

describe("FileExplorer", () => {
	it("renders root entries", () => {
		render(
			<FileExplorer entries={fixtureEntries} ariaLabel="Test tree" />,
		);

		expect(getTreeItemButton("src")).toBeTruthy();
		expect(getTreeItemButton("Project.bproj")).toBeTruthy();
		expect(getTreeItemButton("workspace.bws")).toBeTruthy();
	});

	it("expands a directory to show children on click", async () => {
		render(
			<FileExplorer entries={fixtureEntries} ariaLabel="Test tree" />,
		);

		expect(() => getTreeItemButton("main.bs")).toThrow();

		fireEvent.click(getTreeItemButton("src"));

		await waitFor(() => {
			expect(getTreeItemButton("main.bs")).toBeTruthy();
			expect(getTreeItemButton("lib.bs")).toBeTruthy();
		});
	});

	it("collapses an expanded directory on second click", async () => {
		render(
			<FileExplorer entries={fixtureEntries} ariaLabel="Test tree" />,
		);

		const srcBtn = getTreeItemButton("src");
		fireEvent.click(srcBtn);
		await waitFor(() => {
			expect(getTreeItemButton("main.bs")).toBeTruthy();
		});

		fireEvent.click(srcBtn);
		await waitFor(() => {
			expect(() => getTreeItemButton("main.bs")).toThrow();
		});
	});

	it("calls onSelect when clicking a file", () => {
		const onSelect = vi.fn();
		render(
			<FileExplorer
				entries={fixtureEntries}
				onSelect={onSelect}
				ariaLabel="Test tree"
			/>,
		);

		fireEvent.click(getTreeItemButton("Project.bproj"));

		expect(onSelect).toHaveBeenCalledWith(
			expect.objectContaining({ path: "Project.bproj", kind: "file" }),
		);
	});

	it("does not call onSelect for directories when allowDirectorySelect is false", () => {
		const onSelect = vi.fn();
		render(
			<FileExplorer
				entries={fixtureEntries}
				onSelect={onSelect}
				ariaLabel="Test tree"
			/>,
		);

		fireEvent.click(getTreeItemButton("src"));
		expect(onSelect).not.toHaveBeenCalled();
	});

	it("calls onSelect for directories when allowDirectorySelect is true", () => {
		const onSelect = vi.fn();
		render(
			<FileExplorer
				entries={fixtureEntries}
				onSelect={onSelect}
				allowDirectorySelect
				ariaLabel="Test tree"
			/>,
		);

		fireEvent.click(getTreeItemButton("src"));
		expect(onSelect).toHaveBeenCalledWith(
			expect.objectContaining({ path: "src", kind: "dir" }),
		);
	});

	it("highlights activePath", () => {
		render(
			<FileExplorer
				entries={fixtureEntries}
				activePath="Project.bproj"
				ariaLabel="Test tree"
			/>,
		);

		const btn = getTreeItemButton("Project.bproj");
		expect(btn.className).toMatch(/bg-primary\/10/);
	});

	it("has tree ARIA role", () => {
		render(
			<FileExplorer entries={fixtureEntries} ariaLabel="Files" />,
		);

		expect(screen.getByRole("tree", { name: "Files" })).toBeTruthy();
	});

	it("marks treeitems with aria-expanded for directories", async () => {
		render(
			<FileExplorer entries={fixtureEntries} ariaLabel="Test tree" />,
		);

		const items = screen.getAllByRole("treeitem");
		const dirItem = items.find((el) => el.textContent?.includes("src"));
		expect(dirItem).toBeTruthy();
		expect(dirItem!.getAttribute("aria-expanded")).toBe("false");

		fireEvent.click(getTreeItemButton("src"));
		await waitFor(() => {
			expect(dirItem!.getAttribute("aria-expanded")).toBe("true");
		});
	});

	it("renders empty state", () => {
		render(<FileExplorer entries={[]} ariaLabel="Empty tree" />);
		expect(screen.getByText("No entries to show.")).toBeTruthy();
	});

	it("loads children via listChildren on expand", async () => {
		const listChildren = vi.fn(async (_path: string) => [
			{ path: "remote/main.bs", kind: "file" as const, name: "main.bs" },
		]);

		const dynamicEntry: FileEntry = {
			path: "remote",
			kind: "dir",
			name: "remote",
		};

		render(
			<FileExplorer
				entries={[dynamicEntry]}
				listChildren={listChildren}
				ariaLabel="Test tree"
			/>,
		);

		fireEvent.click(getTreeItemButton("remote"));

		await waitFor(() => {
			expect(getTreeItemButton("main.bs")).toBeTruthy();
		});
		expect(listChildren).toHaveBeenCalledWith("remote");
	});
});
