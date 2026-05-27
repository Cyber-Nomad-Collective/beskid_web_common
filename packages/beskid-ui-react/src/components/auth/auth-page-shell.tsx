import type { ReactNode } from "react";

import { cn } from "../../lib/utils.js";

export interface AuthPageShellProps {
	kicker?: string;
	title: string;
	description?: string;
	footer?: ReactNode;
	error?: string | null;
	className?: string;
	children: ReactNode;
}

export function AuthPageShell({
	kicker = "Beskid",
	title,
	description,
	footer,
	error,
	className,
	children,
}: AuthPageShellProps) {
	return (
		<div
			className={cn(
				"relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-16",
				className,
			)}
		>
			<div className="island-shell w-full max-w-md space-y-6 rounded-2xl p-8">
				<div className="text-center">
					<p className="island-kicker">{kicker}</p>
					<h1 className="display-title mt-2 text-3xl font-bold tracking-tight">
						{title}
					</h1>
					{description ? (
						<p className="text-muted-foreground mt-3 text-sm">{description}</p>
					) : null}
				</div>
				{error ? (
					<p className="text-destructive text-sm text-center" role="alert">
						{error}
					</p>
				) : null}
				{children}
				{footer ? (
					<div className="text-muted-foreground text-center text-xs">{footer}</div>
				) : null}
			</div>
		</div>
	);
}
