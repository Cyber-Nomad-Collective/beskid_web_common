import { describe, expect, it } from "vitest";

import { BESKID_SERVICES } from "./beskid-services";

describe("Beskid shared service registry", () => {
	it("keeps service identifiers unique", () => {
		const ids = BESKID_SERVICES.map((service) => service.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("links the standard service to the canonical OpenSpec reader", () => {
		const standard = BESKID_SERVICES.find(
			(service) => service.id === "platform-spec",
		);
		expect(standard?.href).toBe("https://spec.beskid-lang.org/platform-spec/");
	});
});
