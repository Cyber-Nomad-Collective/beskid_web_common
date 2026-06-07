import type { ReactNode } from "react";

import { cn } from "../../lib/utils.js";

export type SettingsSectionProps = {
	title: string;
	description?: string;
	className?: string;
	children?: ReactNode;
};

export function SettingsSection({
	title,
	description,
	className,
	children,
}: SettingsSectionProps) {
	return (
		<div className={cn("space-y-6", className)}>
			<div className="space-y-1">
				<h2 className="text-lg font-semibold tracking-tight">{title}</h2>
				{description ? (
					<p className="text-muted-foreground text-sm">{description}</p>
				) : null}
			</div>
			{children}
		</div>
	);
}
