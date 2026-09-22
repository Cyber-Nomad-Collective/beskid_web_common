import {
	Badge,
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@cyber-nomad-collective/beskid-ui-react";

export const PackageCard = () => (
	<Card className="w-[380px]">
		<CardHeader>
			<CardTitle>beskid-http</CardTitle>
			<CardDescription>
				Fiber-aware HTTP/1.1 client and server built on the 0.5 networking
				runtime.
			</CardDescription>
			<CardAction>
				<Badge variant="secondary">v0.5.2</Badge>
			</CardAction>
		</CardHeader>
		<CardContent className="flex flex-col gap-2">
			<div className="flex justify-between">
				<span className="text-muted-foreground">Weekly downloads</span>
				<span className="font-medium">12,480</span>
			</div>
			<div className="flex justify-between">
				<span className="text-muted-foreground">License</span>
				<span className="font-medium">Apache-2.0</span>
			</div>
		</CardContent>
		<CardFooter className="gap-2">
			<Button size="sm">Install</Button>
			<Button size="sm" variant="outline">
				Source
			</Button>
		</CardFooter>
	</Card>
);

export const Small = () => (
	<Card size="sm" className="w-[320px]">
		<CardHeader>
			<CardTitle>Build finished</CardTitle>
			<CardDescription>
				linux-x86_64 · 4m 12s · all 1,204 tests passed
			</CardDescription>
		</CardHeader>
		<CardContent>
			<p className="text-muted-foreground">
				Artifacts are checksummed and ready for the manual publish review.
			</p>
		</CardContent>
	</Card>
);
