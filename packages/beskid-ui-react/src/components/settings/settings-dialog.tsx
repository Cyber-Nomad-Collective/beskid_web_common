"use client";

import type { ReactNode } from "react";

import { cn } from "../../lib/utils.js";
import { Button } from "../ui/button.js";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog.js";
import { ScrollArea } from "../ui/scroll-area.js";
import { SettingsFormRenderer } from "./settings-form-renderer.js";
import { SettingsNav } from "./settings-nav.js";
import {
	SettingsProvider,
	type SettingsProviderProps,
	useSettings,
} from "./settings-provider.js";

export type SettingsDialogProps<TValues extends Record<string, unknown>> =
	SettingsProviderProps<TValues> & {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		title?: string;
		description?: string;
		className?: string;
		contentClassName?: string;
		navClassName?: string;
		formClassName?: string;
		saveLabel?: string;
		cancelLabel?: string;
		footer?: ReactNode;
	};

function SettingsDialogBody({
	title,
	description,
	className,
	contentClassName,
	navClassName,
	formClassName,
	saveLabel,
	cancelLabel,
	footer,
	children,
	onClose,
}: {
	title: string;
	description?: string;
	className?: string;
	contentClassName?: string;
	navClassName?: string;
	formClassName?: string;
	saveLabel?: string;
	cancelLabel?: string;
	footer?: ReactNode;
	children?: ReactNode;
	onClose: () => void;
}) {
	const { resetDraft } = useSettings();

	return (
		<DialogContent
			showCloseButton
			onCloseAutoFocus={() => resetDraft()}
			className={cn(
				"flex max-h-[min(calc(100svh-2rem),44rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl",
				className,
			)}
		>
			<DialogHeader className="border-b border-border px-6 py-5">
				<DialogTitle>{title}</DialogTitle>
				{description ? <DialogDescription>{description}</DialogDescription> : null}
			</DialogHeader>

			<div
				className={cn(
					"grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)]",
					contentClassName,
				)}
			>
				<div className="min-h-0 border-b border-border md:border-r md:border-b-0">
					<SettingsNav className={navClassName} />
				</div>
				<ScrollArea className="min-h-0">
					<div className={cn("px-6 py-6", formClassName)}>
						<SettingsFormRenderer />
						{children}
					</div>
				</ScrollArea>
			</div>

			{footer ?? (
				<div className="px-6 pb-6">
					<SettingsDialogFooter
						saveLabel={saveLabel}
						cancelLabel={cancelLabel}
						onClose={onClose}
					/>
				</div>
			)}
		</DialogContent>
	);
}

function SettingsDialogFooter({
	saveLabel = "Save changes",
	cancelLabel = "Cancel",
	onClose,
}: {
	saveLabel?: string;
	cancelLabel?: string;
	onClose: () => void;
}) {
	const { isDirty, isSaving, resetDraft, save } = useSettings();

	return (
		<DialogFooter className="border-t border-border pt-4">
			<Button
				type="button"
				variant="outline"
				onClick={() => {
					resetDraft();
					onClose();
				}}
				disabled={isSaving}
			>
				{cancelLabel}
			</Button>
			<Button
				type="button"
				onClick={() => void save()}
				disabled={!isDirty || isSaving}
			>
				{isSaving ? "Saving…" : saveLabel}
			</Button>
		</DialogFooter>
	);
}

export function SettingsDialog<TValues extends Record<string, unknown>>({
	open,
	onOpenChange,
	registry,
	values,
	onSave,
	defaultSectionId,
	title = "Settings",
	description,
	className,
	contentClassName,
	navClassName,
	formClassName,
	saveLabel,
	cancelLabel,
	footer,
	children,
}: SettingsDialogProps<TValues>) {
	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			onOpenChange(false);
			return;
		}

		onOpenChange(true);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<SettingsProvider
				registry={registry}
				values={values}
				onSave={async (nextValues) => {
					await onSave(nextValues);
					onOpenChange(false);
				}}
				defaultSectionId={defaultSectionId}
			>
				<SettingsDialogBody
					title={title}
					description={description}
					className={className}
					contentClassName={contentClassName}
					navClassName={navClassName}
					formClassName={formClassName}
					saveLabel={saveLabel}
					cancelLabel={cancelLabel}
					footer={footer}
					onClose={() => onOpenChange(false)}
				>
					{children}
				</SettingsDialogBody>
			</SettingsProvider>
		</Dialog>
	);
}
