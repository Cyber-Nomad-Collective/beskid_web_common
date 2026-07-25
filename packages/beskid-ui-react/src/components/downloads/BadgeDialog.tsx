"use client";

import { useCallback, useState } from "react";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { BadgePreview } from "./BadgePreview";
import { InstallCommand } from "./InstallCommand";
import type { BadgeConfig, BadgeStyle, PlatformId } from "./types";

interface BadgeDialogProps {
	version: string;
	platforms: { id: PlatformId; label: string }[];
}

const BADGE_STYLES: BadgeStyle[] = [
	"flat",
	"flat-square",
	"plastic",
	"for-the-badge",
	"social",
];

const DEFAULT_CONFIG: BadgeConfig = {
	kind: "version",
	label: "version",
	message: "",
	color: "blue",
	style: "flat",
};

export function BadgeDialog({ version, platforms }: BadgeDialogProps) {
	const [config, setConfig] = useState<BadgeConfig>({
		...DEFAULT_CONFIG,
		message: version,
	});
	const [open, setOpen] = useState(false);

	const update = useCallback(
		(patch: Partial<BadgeConfig>) => setConfig((prev) => ({ ...prev, ...patch })),
		[],
	);

	const shieldsUrl = buildShieldsUrl(config);

	const markdownBadge = `![${config.label}](${shieldsUrl})`;
	const htmlBadge = `<img alt="${config.label}" src="${shieldsUrl}" />`;
	const urlBadge = shieldsUrl;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					Badges
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Badge Generator</DialogTitle>
					<DialogDescription>
						Create a custom badge for version <strong>{version}</strong>.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					{/* Style picker */}
					<div className="flex flex-col gap-2">
						<span className="text-xs font-medium">Style</span>
						<div className="flex flex-wrap gap-1">
							{BADGE_STYLES.map((style) => (
								<Button
									key={style}
									variant={config.style === style ? "default" : "outline"}
									size="xs"
									onClick={() => update({ style })}
								>
									{style}
								</Button>
							))}
						</div>
					</div>

					{/* Kind picker */}
					<div className="flex flex-col gap-2">
						<span className="text-xs font-medium">Kind</span>
						<div className="flex flex-wrap gap-1">
							{(["version", "platform", "download", "custom"] as const).map((kind) => (
								<Button
									key={kind}
									variant={config.kind === kind ? "default" : "outline"}
									size="xs"
									onClick={() => {
										const patch: Partial<BadgeConfig> = { kind };
										if (kind === "version") {
											patch.label = "version";
											patch.message = version;
										} else if (kind === "platform") {
											patch.label = "platform";
											patch.message = platforms[0]?.label ?? "";
										} else if (kind === "download") {
											patch.label = "download";
											patch.message = version;
										}
										update(patch);
									}}
								>
									{kind}
								</Button>
							))}
						</div>
					</div>

					{/* Platform selector (only for platform kind) */}
					{config.kind === "platform" && (
						<div className="flex flex-col gap-2">
							<span className="text-xs font-medium">Platform</span>
							<div className="flex flex-wrap gap-1">
								{platforms.map((p) => (
									<Button
										key={p.id}
										variant={config.message === p.label ? "default" : "outline"}
										size="xs"
										onClick={() => update({ message: p.label })}
									>
										{p.label}
									</Button>
								))}
							</div>
						</div>
					)}

					{/* Label input */}
					<div className="flex flex-col gap-1">
						<label className="text-xs font-medium" htmlFor="badge-label">
							Label
						</label>
						<input
							id="badge-label"
							type="text"
							value={config.label}
							onChange={(e) => update({ label: e.target.value })}
							className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
						/>
					</div>

					{/* Color input */}
					<div className="flex flex-col gap-1">
						<label className="text-xs font-medium" htmlFor="badge-color">
							Color
						</label>
						<div className="flex items-center gap-2">
							<input
								id="badge-color"
								type="text"
								value={config.color}
								onChange={(e) => update({ color: e.target.value })}
								className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
							<div
								className="size-7 rounded border border-border"
								style={{ backgroundColor: config.color }}
							/>
						</div>
					</div>

					{/* Live preview */}
					<div className="flex flex-col gap-2">
						<span className="text-xs font-medium">Preview</span>
						<BadgePreview config={config} />
					</div>

					{/* Copy sections */}
					<div className="flex flex-col gap-3 border-t border-border pt-3">
						<InstallCommand
							command={markdownBadge}
							label="Markdown"
							badgeLabel="md"
						/>
						<InstallCommand command={htmlBadge} label="HTML" badgeLabel="html" />
						<InstallCommand command={urlBadge} label="URL" badgeLabel="url" />
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function buildShieldsUrl(config: BadgeConfig): string {
	const label = encodeURIComponent(config.label);
	const message = encodeURIComponent(config.message);
	const color = encodeURIComponent(config.color);
	let url = `https://img.shields.io/badge/${label}-${message}-${color}?style=${config.style}`;
	if (config.logo) {
		url += `&logo=${encodeURIComponent(config.logo)}`;
	}
	return url;
}
