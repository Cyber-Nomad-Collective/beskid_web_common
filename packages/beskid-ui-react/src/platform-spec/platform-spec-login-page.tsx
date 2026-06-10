"use client";

import type { ReactNode } from "react";

import { AuthPageShell } from "../components/auth/auth-page-shell.js";
import { Button } from "../components/ui/button.js";

export interface PlatformSpecLoginPageProps {
	signInHref: string;
	error?: string | null;
	footer?: ReactNode;
	themeToggle?: ReactNode;
}

export function PlatformSpecLoginPage({
	signInHref,
	error,
	footer,
	themeToggle,
}: PlatformSpecLoginPageProps) {
	return (
		<div className="relative flex min-h-screen items-center justify-center p-8">
			{themeToggle ? (
				<div className="absolute top-4 right-4">{themeToggle}</div>
			) : null}
			<AuthPageShell
				kicker="Platform Spec"
				title="Sign in"
				description="Platform Spec uses the shared Beskid Auth hub for GitHub sign-in."
				error={error ? "Sign-in failed. Try again." : null}
				footer={footer}
			>
				<a href={signInHref} className="block">
					<Button className="w-full" type="button">
						Sign in with GitHub
					</Button>
				</a>
			</AuthPageShell>
		</div>
	);
}
