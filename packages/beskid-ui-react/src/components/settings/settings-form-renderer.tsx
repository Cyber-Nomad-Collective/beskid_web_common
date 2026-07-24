"use client";

import { useMemo } from "react";

import { cn } from "../../lib/utils.js";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "../ui/field.js";
import { Input } from "../ui/input.js";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select.js";
import { Switch } from "../ui/switch.js";
import { useSettings } from "./settings-provider.js";
import { SettingsSection } from "./settings-section.js";
import type { SettingsFieldDef } from "./types.js";

function ReadonlyValue({ value }: { value: unknown }) {
	const displayValue =
		value === null || value === undefined || value === ""
			? "—"
			: typeof value === "string"
				? value
				: JSON.stringify(value);

	return (
		<div className="bg-muted/40 text-foreground rounded-4xl border border-border px-3 py-2 text-sm">
			{displayValue}
		</div>
	);
}

function SettingsFieldRenderer<TValues extends Record<string, unknown>>({
	field,
}: {
	field: SettingsFieldDef<TValues>;
}) {
	const { draft, setFieldValue, isFieldDisabled, isFieldHidden } =
		useSettings<TValues>();

	if (isFieldHidden(field.id)) {
		return null;
	}

	const disabled = isFieldDisabled(field.id);
	const value = draft[field.id];

	const onChange = (nextValue: unknown) => {
		setFieldValue(field.id, nextValue as TValues[typeof field.id]);
	};

	const control = (() => {
		switch (field.kind) {
			case "text":
			case "url":
				return (
					<Input
						type={field.kind === "url" ? "url" : "text"}
						value={typeof value === "string" ? value : String(value ?? "")}
						onChange={(event) => onChange(event.target.value)}
						placeholder={field.placeholder}
						disabled={disabled}
					/>
				);
			case "password":
				return (
					<Input
						type="password"
						value={typeof value === "string" ? value : String(value ?? "")}
						onChange={(event) => onChange(event.target.value)}
						placeholder={field.placeholder}
						disabled={disabled}
						autoComplete="off"
					/>
				);
			case "switch":
				return (
					<Switch
						checked={Boolean(value)}
						onCheckedChange={(checked) => onChange(checked)}
						disabled={disabled}
					/>
				);
			case "select":
				return (
					<Select
						value={typeof value === "string" ? value : String(value ?? "")}
						onValueChange={(nextValue) => onChange(nextValue)}
						disabled={disabled}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={field.placeholder ?? "Select an option"} />
						</SelectTrigger>
						<SelectContent>
							{(field.options ?? []).map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);
			case "readonly":
				return <ReadonlyValue value={value} />;
			case "custom":
				return field.render?.({
					field,
					value,
					draft,
					disabled,
					onChange,
				});
			default:
				return null;
		}
	})();

	if (field.kind === "custom" && !field.render) {
		return null;
	}

	const orientation = field.kind === "switch" ? "horizontal" : "vertical";

	return (
		<Field orientation={orientation}>
			<FieldContent>
				<FieldLabel htmlFor={field.id}>{field.label}</FieldLabel>
				{field.description ? (
					<FieldDescription>{field.description}</FieldDescription>
				) : null}
			</FieldContent>
			<div
				className={cn(field.kind === "switch" ? "flex items-center" : "w-full")}
			>
				{control}
			</div>
		</Field>
	);
}

export type SettingsFormRendererProps = {
	className?: string;
	sectionId?: string;
};

export function SettingsFormRenderer({
	className,
	sectionId,
}: SettingsFormRendererProps) {
	const { registry, activeSectionId } = useSettings();

	const resolvedSectionId = sectionId ?? activeSectionId;

	const section = useMemo(() => {
		for (const group of registry.groups) {
			const match = group.sections.find((item) => item.id === resolvedSectionId);
			if (match) {
				return match;
			}
		}

		return null;
	}, [registry.groups, resolvedSectionId]);

	if (!section) {
		return null;
	}

	return (
		<SettingsSection
			title={section.title}
			description={section.description}
			className={className}
		>
			<FieldGroup>
				{section.fields.map((field) => (
					<SettingsFieldRenderer key={field.id} field={field} />
				))}
			</FieldGroup>
		</SettingsSection>
	);
}
