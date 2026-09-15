import { BRAND_ICON_BODIES } from "./brand-icons.generated";

export type BeskidHubIcon = Exclude<keyof typeof BRAND_ICON_BODIES, "brand">;
let iconInstance = 0;

/** Brand artwork is generated from the canonical brand SVG exports. */
export function hubIconSvg(icon: BeskidHubIcon, instance?: string): string {
 const suffix = (instance ?? `hub-${++iconInstance}`).replace(/[^a-zA-Z0-9_-]/g, "_");
 const body = BRAND_ICON_BODIES[icon].replaceAll(`ridge-${icon === "home" ? "website" : icon}`, `ridge-${icon}-${suffix}`);
 return `<svg class="beskid-hub__tile-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 120 120" aria-hidden="true">${body}</svg>`;
}

export function brandIconSvg(): string {
 return `<svg class="beskid-header__brand-logo" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 120 120" aria-hidden="true">${BRAND_ICON_BODIES.brand}</svg>`;
}

/** Grid icon for the hub launcher button (2x2 squares). */
export function hubLauncherIconSvg(): string {
	return `<svg class="beskid-hub-trigger__icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>`;
}
