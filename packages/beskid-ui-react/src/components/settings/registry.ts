import type { SettingsRegistry } from "./types.js";

export function defineSettingsRegistry<
	TValues extends Record<string, unknown>,
>(registry: SettingsRegistry<TValues>): SettingsRegistry<TValues> {
	return registry;
}
