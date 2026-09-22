import {
	Avatar,
	AvatarBadge,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@cyber-nomad-collective/beskid-ui-react";

export const Sizes = () => (
	<div className="flex items-center gap-4">
		<Avatar size="sm">
			<AvatarFallback>PM</AvatarFallback>
		</Avatar>
		<Avatar>
			<AvatarFallback>PM</AvatarFallback>
		</Avatar>
		<Avatar size="lg">
			<AvatarFallback>PM</AvatarFallback>
		</Avatar>
	</div>
);

export const WithStatus = () => (
	<div className="flex items-center gap-4">
		<Avatar size="lg">
			<AvatarFallback>AK</AvatarFallback>
			<AvatarBadge />
		</Avatar>
		<div className="flex flex-col">
			<span className="text-sm font-medium">Ania Kowalska</span>
			<span className="text-xs text-muted-foreground">Online · compiler team</span>
		</div>
	</div>
);

export const Group = () => (
	<AvatarGroup>
		<Avatar>
			<AvatarFallback>AK</AvatarFallback>
		</Avatar>
		<Avatar>
			<AvatarFallback>JN</AvatarFallback>
		</Avatar>
		<Avatar>
			<AvatarFallback>TW</AvatarFallback>
		</Avatar>
		<AvatarGroupCount>+4</AvatarGroupCount>
	</AvatarGroup>
);
