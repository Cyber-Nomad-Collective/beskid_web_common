import { Label, Switch } from "@cyber-nomad-collective/beskid-ui-react";

export const States = () => (
	<div className="flex flex-col gap-4">
		<div className="flex items-center gap-3">
			<Switch id="sw-telemetry" defaultChecked />
			<Label htmlFor="sw-telemetry">Send anonymous build telemetry</Label>
		</div>
		<div className="flex items-center gap-3">
			<Switch id="sw-nightly" />
			<Label htmlFor="sw-nightly">Use nightly toolchain</Label>
		</div>
		<div className="flex items-center gap-3">
			<Switch id="sw-locked" disabled defaultChecked />
			<Label htmlFor="sw-locked">Managed by organization</Label>
		</div>
	</div>
);

export const Sizes = () => (
	<div className="flex items-center gap-6">
		<div className="flex items-center gap-2">
			<Switch size="sm" defaultChecked aria-label="Small switch" />
			<span className="text-sm text-muted-foreground">sm</span>
		</div>
		<div className="flex items-center gap-2">
			<Switch defaultChecked aria-label="Default switch" />
			<span className="text-sm text-muted-foreground">default</span>
		</div>
	</div>
);
