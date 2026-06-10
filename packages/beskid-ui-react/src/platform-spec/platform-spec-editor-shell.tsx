"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/utils.js";

export interface PlatformSpecEditorNavLink {
	label: string;
	href: string;
	active?: boolean;
	onNavigate?: (href: string) => void;
}

export interface PlatformSpecEditorShellProps {
	title?: string;
	userLogin: string;
	navLinks: PlatformSpecEditorNavLink[];
	signOutHref: string;
	themeToggle?: ReactNode;
	className?: string;
	children: ReactNode;
}

export function PlatformSpecEditorShell({
	title = "Platform Spec Editor",
	userLogin,
	navLinks,
	signOutHref,
	themeToggle,
	className,
	children,
}: PlatformSpecEditorShellProps) {
	return (
		<div className={cn("min-h-screen", className)}>
			<header className="flex items-center justify-between border-b px-6 py-3">
				<nav className="flex items-center gap-4 text-sm">
					<span className="font-semibold">{title}</span>
					{navLinks.map((link) =>
						link.onNavigate ? (
							<button
								key={link.href}
								type="button"
								className={
									link.active
										? "font-medium text-foreground"
										: "text-muted-foreground hover:underline"
								}
								onClick={() => link.onNavigate?.(link.href)}
							>
								{link.label}
							</button>
						) : (
							<a
								key={link.href}
								href={link.href}
								className={
									link.active
										? "font-medium text-foreground"
										: "text-muted-foreground hover:underline"
								}
							>
								{link.label}
							</a>
						),
					)}
				</nav>
				<div className="flex items-center gap-3 text-sm">
					<span className="text-muted-foreground">@{userLogin}</span>
					{themeToggle}
					<a href={signOutHref} className="underline">
						Sign out
					</a>
				</div>
			</header>
			<main className="p-6">{children}</main>
		</div>
	);
}
