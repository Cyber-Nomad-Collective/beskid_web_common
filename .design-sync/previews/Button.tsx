import { Button } from "@cyber-nomad-collective/beskid-ui-react";
import { ArrowRight, Download, Plus, Trash2 } from "lucide-react";

export const Variants = () => (
	<div className="flex flex-wrap items-center gap-3">
		<Button>Publish package</Button>
		<Button variant="secondary">Save draft</Button>
		<Button variant="outline">View on pckg</Button>
		<Button variant="ghost">Cancel</Button>
		<Button variant="destructive">Yank version</Button>
		<Button variant="link">Read the Book</Button>
	</div>
);

export const Sizes = () => (
	<div className="flex flex-wrap items-center gap-3">
		<Button size="xs">Extra small</Button>
		<Button size="sm">Small</Button>
		<Button>Default</Button>
		<Button size="lg">Large</Button>
	</div>
);

export const WithIcons = () => (
	<div className="flex flex-wrap items-center gap-3">
		<Button>
			<Download data-icon="inline-start" />
			Download beskid 0.5
		</Button>
		<Button variant="outline">
			Continue
			<ArrowRight data-icon="inline-end" />
		</Button>
		<Button size="icon" variant="outline" aria-label="Add task">
			<Plus />
		</Button>
		<Button size="icon-sm" variant="destructive" aria-label="Delete">
			<Trash2 />
		</Button>
	</div>
);

export const Disabled = () => (
	<div className="flex flex-wrap items-center gap-3">
		<Button disabled>Publishing…</Button>
		<Button variant="outline" disabled>
			Unavailable
		</Button>
	</div>
);
