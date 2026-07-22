import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  discoverTrackedDocTests,
  requireTrackedDocTests,
} from "../../scripts/control/run-doc-tests.mjs";

test("the docs shard fails closed when it is implicated without tracked tests", () => {
  assert.throws(() => requireTrackedDocTests([]), /no tracked docs\/\*\*\/\*.test\.mjs files/);
});

test("the docs shard discovers only tracked documentation tests", async (t) => {
  const cwd = await mkdtemp(join(tmpdir(), "victoroff-doc-tests-"));
  t.after(async () => {
    const { rm } = await import("node:fs/promises");
    await rm(cwd, { recursive: true, force: true });
  });
  execFileSync("git", ["init", "-q"], { cwd });
  await mkdir(join(cwd, "docs", "governance"), { recursive: true });
  await writeFile(join(cwd, "docs", "governance", "manifest.test.mjs"), "export {};\n");
  await writeFile(join(cwd, "docs", "governance", "draft.test.mjs"), "export {};\n");
  execFileSync("git", ["add", "docs/governance/manifest.test.mjs"], { cwd });
  assert.deepEqual(discoverTrackedDocTests({ cwd }), ["docs/governance/manifest.test.mjs"]);
});
