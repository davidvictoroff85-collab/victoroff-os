import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { checkShardResults, SHARD_NAMES } from "../../scripts/control/check-ci-shard-results.mjs";

function results(overrides = {}) {
  return Object.fromEntries(SHARD_NAMES.map((name) => [name, overrides[name] ?? "skipped"]));
}

test("the gate accepts successful implicated shards and intentional skips", () => {
  assert.deepEqual(checkShardResults(results({ scope: "success", control: "success", docs: "success" })), []);
});

test("the gate rejects a failed docs shard and a missing scope receipt", () => {
  assert.deepEqual(checkShardResults(results({ scope: "success", docs: "failure" })), ["docs=failure"]);
  assert.deepEqual(checkShardResults(results()), ["scope=skipped"]);
});

test("the workflow checks out the tested gate implementation", async () => {
  const workflow = await readFile(new URL("../../.github/workflows/verify.yml", import.meta.url), "utf8");
  const gate = workflow.slice(workflow.indexOf("  gate:"));
  assert.ok(gate.indexOf("uses: actions/checkout@v4") < gate.indexOf("node scripts/control/check-ci-shard-results.mjs"));
});
