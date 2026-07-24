import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.js";
import { Badge } from "../ui/badge.js";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card.js";

export interface ProfileUser {
	login: string;
	name: string | null;
	avatarUrl: string;
}

export interface ProfileCardProps {
	user: ProfileUser;
	children?: React.ReactNode;
}

export function ProfileCard({ user, children }: ProfileCardProps) {
	const initials = user.login.slice(0, 2).toUpperCase();

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-4">
					<Avatar size="lg">
						<AvatarImage src={user.avatarUrl} alt={user.login} />
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<CardTitle>{user.name ?? user.login}</CardTitle>
						<CardDescription>@{user.login}</CardDescription>
					</div>
					<Badge variant="secondary" className="ml-auto">
						GitHub
					</Badge>
				</div>
			</CardHeader>
			{children ? <CardContent>{children}</CardContent> : null}
		</Card>
	);
}
