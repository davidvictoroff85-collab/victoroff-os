import test from "node:test";
import assert from "node:assert/strict";
import { classifyChangedFiles, planChangedFiles } from "../../scripts/control/ci-plan.mjs";

test("registry-only changes run the control shard", () => {
  assert.deepEqual(classifyChangedFiles(["program/registry.v1.json"]), {
    control: true,
    docs: false,
    code: false,
    browser: false,
    release: false,
  });
});

test("site changes run code, browser, and release shards", () => {
  assert.deepEqual(classifyChangedFiles(["apps/site/index.html"]), {
    control: false,
    docs: false,
    code: true,
    browser: true,
    release: true,
  });
});

test("root dependency changes run every dependency-backed shard", () => {
  assert.deepEqual(classifyChangedFiles(["pnpm-lock.yaml"]), {
    control: true,
    docs: false,
    code: true,
    browser: true,
    release: true,
  });
});

test("governance and finance test files run the dedicated docs shard", () => {
  for (const path of ["docs/governance/manifest.test.mjs", "docs/finance/reservation.test.mjs"]) {
    assert.deepEqual(classifyChangedFiles([path]), {
      control: false,
      docs: true,
      code: false,
      browser: false,
      release: false,
    });
  }
});

test("institutional intelligence architecture documents run the dedicated docs shard", () => {
  for (const path of [
    "docs/current-state.md",
    "docs/target-architecture.md",
    "docs/gap-analysis.md",
    "docs/implementation-plan.md",
    "docs/adr/0001-canonical-institutional-model.md",
  ]) {
    assert.deepEqual(classifyChangedFiles([path]), {
      control: false,
      docs: true,
      code: false,
      browser: false,
      release: false,
    });
  }
});

test("a nonempty unclassified diff fails closed in the plan", () => {
  assert.deepEqual(planChangedFiles(["unowned/new-surface.txt"]).unclassified, ["unowned/new-surface.txt"]);
  assert.deepEqual(planChangedFiles(["docs/research/new-surface.md"]).unclassified, ["docs/research/new-surface.md"]);
  assert.deepEqual(planChangedFiles([]).unclassified, []);
});
