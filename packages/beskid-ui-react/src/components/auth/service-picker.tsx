import { ArrowRight } from "lucide-react";

import { cn } from "../../lib/utils.js";

export interface AuthServiceOption {
	id: string;
	label: string;
	description: string;
	href: string;
}

export interface ServicePickerProps {
	services: AuthServiceOption[];
	className?: string;
}

export function ServicePicker({ services, className }: ServicePickerProps) {
	return (
		<div className={cn("grid gap-3", className)}>
			{services.map((service) => (
				<a
					key={service.id}
					href={service.href}
					className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-card/50 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
				>
					<div className="min-w-0">
						<p className="font-semibold">{service.label}</p>
						<p className="text-muted-foreground mt-1 text-sm">
							{service.description}
						</p>
					</div>
					<ArrowRight className="text-muted-foreground mt-0.5 size-4 shrink-0 opacity-0 transition group-hover:opacity-100" />
				</a>
			))}
		</div>
	);
}
