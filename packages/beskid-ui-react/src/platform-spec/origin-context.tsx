import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SPEC_ORIGIN } from "@cyber-nomad-collective/spec-core";

export interface SpecOriginContextValue {
	origin: string;
	resolveHref: (path: string) => string;
}

const SpecOriginContext = createContext<SpecOriginContextValue>({
	origin: DEFAULT_SPEC_ORIGIN,
	resolveHref: (path) =>
		`${DEFAULT_SPEC_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`,
});

export function SpecOriginProvider({
	origin = DEFAULT_SPEC_ORIGIN,
	children,
}: {
	origin?: string;
	children: ReactNode;
}) {
	const normalized = origin.replace(/\/$/, "");
	const value: SpecOriginContextValue = {
		origin: normalized,
		resolveHref: (path) =>
			`${normalized}${path.startsWith("/") ? path : `/${path}`}`,
	};
	return (
		<SpecOriginContext.Provider value={value}>
			{children}
		</SpecOriginContext.Provider>
	);
}

export function useSpecOrigin(): SpecOriginContextValue {
	return useContext(SpecOriginContext);
}
