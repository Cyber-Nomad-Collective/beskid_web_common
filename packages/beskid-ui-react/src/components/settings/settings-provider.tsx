"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

import type { SettingsRegistry } from "./types.js";

function resolveMaybeFn<TValues extends Record<string, unknown>, T>(
	value: T | ((values: TValues) => T) | undefined,
	values: TValues,
): T | undefined {
	if (typeof value === "function") {
		return (value as (values: TValues) => T)(values);
	}

	return value;
}

function valuesEqual<TValues extends Record<string, unknown>>(
	left: TValues,
	right: TValues,
): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

export type SettingsProviderProps<TValues extends Record<string, unknown>> = {
	registry: SettingsRegistry<TValues>;
	values: TValues;
	onSave: (values: TValues) => void | Promise<void>;
	defaultSectionId?: string;
	children: ReactNode;
};

export type SettingsContextValue<TValues extends Record<string, unknown>> = {
	registry: SettingsRegistry<TValues>;
	values: TValues;
	draft: TValues;
	isDirty: boolean;
	isSaving: boolean;
	activeSectionId: string;
	setActiveSectionId: (sectionId: string) => void;
	setFieldValue: <K extends keyof TValues & string>(
		fieldId: K,
		value: TValues[K],
	) => void;
	resetDraft: () => void;
	save: () => Promise<void>;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	isFieldDisabled: (fieldId: keyof TValues & string) => boolean;
	isFieldHidden: (fieldId: keyof TValues & string) => boolean;
};

const SettingsContext = createContext<SettingsContextValue<
	Record<string, unknown>
> | null>(null);

function getDefaultSectionId<TValues extends Record<string, unknown>>(
	registry: SettingsRegistry<TValues>,
	preferredSectionId?: string,
): string {
	if (preferredSectionId) {
		for (const group of registry.groups) {
			if (group.sections.some((section) => section.id === preferredSectionId)) {
				return preferredSectionId;
			}
		}
	}

	return registry.groups[0]?.sections[0]?.id ?? "";
}

export function SettingsProvider<TValues extends Record<string, unknown>>({
	registry,
	values,
	onSave,
	defaultSectionId,
	children,
}: SettingsProviderProps<TValues>) {
	const [draft, setDraft] = useState(values);
	const [isSaving, setIsSaving] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeSectionId, setActiveSectionId] = useState(() =>
		getDefaultSectionId(registry, defaultSectionId),
	);

	useEffect(() => {
		setDraft(values);
	}, [values]);

	useEffect(() => {
		setActiveSectionId((current) => {
			const exists = registry.groups.some((group) =>
				group.sections.some((section) => section.id === current),
			);

			if (exists) {
				return current;
			}

			return getDefaultSectionId(registry, defaultSectionId);
		});
	}, [defaultSectionId, registry]);

	const isDirty = useMemo(
		() => !valuesEqual(values, draft),
		[values, draft],
	);

	const setFieldValue = useCallback(
		<K extends keyof TValues & string>(fieldId: K, value: TValues[K]) => {
			setDraft((current) => ({
				...current,
				[fieldId]: value,
			}));
		},
		[],
	);

	const resetDraft = useCallback(() => {
		setDraft(values);
	}, [values]);

	const save = useCallback(async () => {
		setIsSaving(true);

		try {
			await onSave(draft);
		} finally {
			setIsSaving(false);
		}
	}, [draft, onSave]);

	const isFieldDisabled = useCallback(
		(fieldId: keyof TValues & string) => {
			for (const group of registry.groups) {
				for (const section of group.sections) {
					const field = section.fields.find((item) => item.id === fieldId);
					if (field) {
						return resolveMaybeFn(field.disabled, draft) ?? false;
					}
				}
			}

			return false;
		},
		[draft, registry.groups],
	);

	const isFieldHidden = useCallback(
		(fieldId: keyof TValues & string) => {
			for (const group of registry.groups) {
				for (const section of group.sections) {
					const field = section.fields.find((item) => item.id === fieldId);
					if (field) {
						return resolveMaybeFn(field.hidden, draft) ?? false;
					}
				}
			}

			return false;
		},
		[draft, registry.groups],
	);

	const contextValue = useMemo(
		() =>
			({
				registry,
				values,
				draft,
				isDirty,
				isSaving,
				activeSectionId,
				setActiveSectionId,
				setFieldValue,
				resetDraft,
				save,
				searchQuery,
				setSearchQuery,
				isFieldDisabled,
				isFieldHidden,
			}) satisfies SettingsContextValue<TValues>,
		[
			activeSectionId,
			draft,
			isDirty,
			isFieldDisabled,
			isFieldHidden,
			isSaving,
			registry,
			resetDraft,
			save,
			searchQuery,
			setFieldValue,
			values,
		],
	);

	return (
		<SettingsContext.Provider
			value={
				contextValue as SettingsContextValue<Record<string, unknown>>
			}
		>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings<
	TValues extends Record<string, unknown> = Record<string, unknown>,
>(): SettingsContextValue<TValues> {
	const context = useContext(SettingsContext);

	if (!context) {
		throw new Error("useSettings must be used within a SettingsProvider.");
	}

	return context as SettingsContextValue<TValues>;
}
