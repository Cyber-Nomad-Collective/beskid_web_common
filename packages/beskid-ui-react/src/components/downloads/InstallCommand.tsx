"use client";

import { useCallback, useState } from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface InstallCommandProps {
	command: string;
	label: string;
	badgeLabel?: string;
}

export function InstallCommand({
	command,
	label,
	badgeLabel,
}: InstallCommandProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(command);
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		} catch {
			// clipboard unavailable — silently ignore
		}
	}, [command]);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<Badge variant="secondary">{badgeLabel ?? label}</Badge>
				<span className="text-xs text-muted-foreground">{label}</span>
			</div>
			<div className="relative">
				<pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 text-sm font-mono">
					<code>{command}</code>
				</pre>
				<Button
					variant="ghost"
					size="xs"
					onClick={handleCopy}
					className={cn("absolute top-2 right-2", copied && "text-green-600")}
				>
					{copied ? "Copied!" : "Copy"}
				</Button>
			</div>
		</div>
	);
}
