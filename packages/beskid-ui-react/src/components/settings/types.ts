import type { ComponentType, ReactNode } from "react";

export type SettingsFieldKind =
	| "text"
	| "url"
	| "password"
	| "switch"
	| "select"
	| "readonly"
	| "custom";

export type SettingsSelectOption = {
	value: string;
	label: string;
};

export type SettingsCustomFieldRenderProps<
	TValues extends Record<string, unknown>,
> = {
	field: SettingsFieldDef<TValues>;
	value: unknown;
	draft: TValues;
	disabled?: boolean;
	onChange: (value: unknown) => void;
};

export type SettingsFieldDef<TValues extends Record<string, unknown>> = {
	id: keyof TValues & string;
	kind: SettingsFieldKind;
	label: string;
	description?: string;
	placeholder?: string;
	disabled?: boolean | ((values: TValues) => boolean);
	hidden?: boolean | ((values: TValues) => boolean);
	options?: SettingsSelectOption[];
	render?: (props: SettingsCustomFieldRenderProps<TValues>) => ReactNode;
};

export type SettingsSectionDef<TValues extends Record<string, unknown>> = {
	id: string;
	title: string;
	description?: string;
	keywords?: string[];
	fields: SettingsFieldDef<TValues>[];
};

export type SettingsGroupDef<TValues extends Record<string, unknown>> = {
	id: string;
	label: string;
	icon?: ComponentType<{ className?: string }>;
	sections: SettingsSectionDef<TValues>[];
};

export type SettingsRegistry<TValues extends Record<string, unknown>> = {
	groups: SettingsGroupDef<TValues>[];
};
