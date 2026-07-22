import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validatePrimaryNavigation } from "../../scripts/control/check-primary-navigation.mjs";

test("current primary navigation excludes detailed delivery evidence", async () => {
  const html = await readFile(new URL("../../apps/site/index.html", import.meta.url), "utf8");
  assert.deepEqual(validatePrimaryNavigation(html), []);
});

test("PR-style phase and outcome links are rejected", () => {
  const html = '<nav aria-label="Primary navigation"><a href="#delivery">Phases</a><a href="#measurement">Outcomes</a></nav>';
  const errors = validatePrimaryNavigation(html);
  assert.equal(errors.length, 3);
});
