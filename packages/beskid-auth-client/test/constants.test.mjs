import assert from "node:assert/strict";
import test from "node:test";

import { AUTH_APP_IDS, AUTH_APP_META } from "../src/constants.js";

test("auth app registry contains only deployed interactive services", () => {
	assert.deepEqual(AUTH_APP_IDS, ["tracker", "nexus", "pckg", "learn"]);
	assert.deepEqual(Object.keys(AUTH_APP_META), AUTH_APP_IDS);
	assert.equal(AUTH_APP_META.tracker.description, "Kanban delivery tracking and issue management.");
});
