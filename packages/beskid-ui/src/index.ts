/**
 * Beskid docs shell: Starlight overrides, platform-spec reader chrome, and client scripts.
 * Import Astro components via `@beskid/beskid-ui/platform-spec/…` or `@beskid/beskid-ui/starlight/…`.
 */

export { initBeskidHub, initBeskidHubAfterBlazor } from "./client/beskid-hub";
export {
	BESKID_SERVICES,
	type BeskidService,
	type BeskidServiceIcon,
} from "./data/beskid-services";
export {
	type BeskidHubIcon,
	hubIconSvg,
	hubLauncherIconSvg,
} from "./hub/icons";
export { BeskidHub, type BeskidHubProps } from "./react/BeskidHub";
