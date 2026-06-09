import { Badge } from "../components/ui/badge.js";
import type { SpecDocumentModel } from "./types.js";

export function SpecPageHeader({
	title,
	description,
	specLevel,
	status,
}: Pick<
	SpecDocumentModel,
	"title" | "description" | "specLevel" | "status"
>) {
	return (
		<header className="mb-8 border-b border-border/70 pb-6">
			<div className="mb-3 flex flex-wrap items-center gap-2">
				{specLevel ? <Badge variant="secondary">{specLevel}</Badge> : null}
				{status ? <Badge variant="outline">{status}</Badge> : null}
			</div>
			<h1 className="display-title text-3xl font-bold tracking-tight">{title}</h1>
			{description ? (
				<p className="mt-3 text-base text-muted-foreground">{description}</p>
			) : null}
		</header>
	);
}
