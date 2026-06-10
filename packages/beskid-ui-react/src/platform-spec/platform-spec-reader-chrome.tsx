"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/utils.js";

export interface PlatformSpecReaderChromeProps {
	hubSlot?: ReactNode;
	title?: string;
	titleHref?: string;
	onTitleNavigate?: (href: string) => void;
	className?: string;
	children: ReactNode;
}

export function PlatformSpecReaderChrome({
	hubSlot,
	title = "Platform specification",
	titleHref = "/platform-spec/",
	onTitleNavigate,
	className,
	children,
}: PlatformSpecReaderChromeProps) {
	return (
		<div className={cn("reader-layout flex min-h-screen flex-col", className)}>
			<header className="spec-topbar sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur">
				{hubSlot}
				{onTitleNavigate ? (
					<button
						type="button"
						className="text-sm font-semibold tracking-tight hover:underline"
						onClick={() => onTitleNavigate(titleHref)}
					>
						{title}
					</button>
				) : (
					<a
						href={titleHref}
						className="text-sm font-semibold tracking-tight hover:underline"
					>
						{title}
					</a>
				)}
			</header>
			<div className="min-h-0 flex-1">{children}</div>
		</div>
	);
}
