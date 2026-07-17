import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { sampleRepo } from "../graph/fixtures/index.js";
import { RepoExplorerDialog } from "./RepoExplorerDialog.js";

describe("RepoExplorerDialog", () => {
	it("renders fixture entries and confirms a file", async () => {
		const onSelect = vi.fn();
		const onOpenChange = vi.fn();

		render(
			<RepoExplorerDialog
				open
				onOpenChange={onOpenChange}
				entries={[sampleRepo]}
				onSelect={onSelect}
			/>,
		);

		expect(screen.getByText("Browse repository")).toBeTruthy();
		expect(screen.getByText("examples")).toBeTruthy();

		fireEvent.click(screen.getByText("examples"));
		await waitFor(() => {
			expect(screen.getByText("hello.bs")).toBeTruthy();
		});

		fireEvent.click(screen.getByText("hello.bs"));
		fireEvent.click(screen.getByRole("button", { name: "Select" }));

		expect(onSelect).toHaveBeenCalledWith(
			expect.objectContaining({ path: "examples/hello.bs", kind: "file" }),
		);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("loads remote roots via listChildren", async () => {
		const listChildren = vi.fn(async (path: string) => {
			if (path === "") {
				return [{ path: "remote", kind: "dir" as const, name: "remote" }];
			}
			return [{ path: "remote/a.bs", kind: "file" as const, name: "a.bs" }];
		});

		render(
			<RepoExplorerDialog
				open
				onOpenChange={() => {}}
				listChildren={listChildren}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("remote")).toBeTruthy();
		});
		expect(listChildren).toHaveBeenCalledWith("");
	});
});
