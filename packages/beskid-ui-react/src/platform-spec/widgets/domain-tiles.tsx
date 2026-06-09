import type { CatalogEntry, WidgetEditorProps, WidgetViewProps } from "../types.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";

export function DomainTilesView({
	props,
	catalogEntries = [],
}: WidgetViewProps<{ pathPrefix: string; heading: string }>) {
	const prefix = props.pathPrefix.replace(/\/$/, "");
	const children = catalogEntries.filter((entry) => {
		const slug = entry.slug.replace(/\/$/, "");
		return (
			slug.startsWith(`${prefix}/`) &&
			slug.split("/").length === prefix.split("/").length + 1
		);
	});

	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold">{props.heading}</h2>
			<div className="grid gap-3 sm:grid-cols-2">
				{children.map((entry) => (
					<a
						key={entry.slug}
						href={entry.href}
						className="rounded-lg border border-border/70 p-4 transition-colors hover:border-primary/40"
					>
						<h3 className="font-medium">{entry.title}</h3>
						{entry.description ? (
							<p className="mt-1 text-sm text-muted-foreground">
								{entry.description}
							</p>
						) : null}
					</a>
				))}
			</div>
		</section>
	);
}

export function DomainTilesEditor({
	props,
	onChange,
}: WidgetEditorProps<{ pathPrefix: string; heading: string }>) {
	return (
		<div className="grid gap-3">
			<div className="grid gap-1">
				<Label htmlFor="pathPrefix">Path prefix</Label>
				<Input
					id="pathPrefix"
					value={props.pathPrefix}
					onChange={(e) =>
						onChange({ ...props, pathPrefix: e.target.value })
					}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="heading">Heading</Label>
				<Input
					id="heading"
					value={props.heading}
					onChange={(e) => onChange({ ...props, heading: e.target.value })}
				/>
			</div>
		</div>
	);
}
