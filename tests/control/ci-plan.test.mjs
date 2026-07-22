import test from "node:test";
import assert from "node:assert/strict";
import { classifyChangedFiles } from "../../scripts/control/ci-plan.mjs";

test("registry-only changes run the control shard", () => {
  assert.deepEqual(classifyChangedFiles(["program/registry.v1.json"]), {
    control: true,
    code: false,
    browser: false,
    release: false,
  });
});

test("site changes run code, browser, and release shards", () => {
  assert.deepEqual(classifyChangedFiles(["apps/site/index.html"]), {
    control: false,
    code: true,
    browser: true,
    release: true,
  });
});

test("root dependency changes run every shard", () => {
  assert.deepEqual(classifyChangedFiles(["pnpm-lock.yaml"]), {
    control: true,
    code: true,
    browser: true,
    release: true,
  });
});
