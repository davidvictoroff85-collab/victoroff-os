import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const requiredDocuments = [
  ["current state", new URL("../current-state.md", import.meta.url), "# Victoroff.ai current state"],
  ["target architecture", new URL("../target-architecture.md", import.meta.url), "# Victoroff.ai target architecture"],
  ["gap analysis", new URL("../gap-analysis.md", import.meta.url), "# Victoroff.ai gap analysis"],
  ["implementation plan", new URL("../implementation-plan.md", import.meta.url), "# Victoroff.ai implementation plan"],
];

const adrUrls = [
  new URL("./0001-unified-institutional-model.md", import.meta.url),
  new URL("./0002-sqlite-first-retrieval.md", import.meta.url),
  new URL("./0003-ai-evidence-and-authority-boundary.md", import.meta.url),
];

async function text(url) {
  return readFile(url, "utf8");
}

test("the four required architecture documents are present and labelled", async () => {
  for (const [label, url, heading] of requiredDocuments) {
    const body = await text(url);
    assert.ok(body.startsWith(heading), label + " heading mismatch");
    assert.match(body, /uncommissioned|synthetic/i, label + " must retain the current authority mode");
  }
});

test("the target preserves shared domains, provenance, permissions, and seven actions", async () => {
  const target = await text(new URL("../target-architecture.md", import.meta.url));
  const normalizedTarget = target.replace(/\s+/g, " ");
  for (const domain of [
    "BBNC Intelligence",
    "Pedro Bay Intelligence",
    "Regional Corporation Intelligence",
    "Village Corporation Intelligence",
    "Foundation / Nonprofit Intelligence",
  ]) {
    assert.ok(normalizedTarget.includes(domain), "missing domain " + domain);
  }
  assert.ok(normalizedTarget.includes("Source -> Extracted Information -> Claim -> Entity or Relationship -> Analysis"));
  assert.match(target, /server-side authorization/i);
  for (const action of [
    "Start",
    "Decide",
    "Build",
    "Release",
    "Find a Rule",
    "See What's Happening",
    "Understand Victoroff",
  ]) {
    assert.ok(normalizedTarget.includes(action), "missing action " + action);
  }
});

test("the current state and plan do not invent unavailable authority", async () => {
  const current = await text(new URL("../current-state.md", import.meta.url));
  const plan = await text(new URL("../implementation-plan.md", import.meta.url));
  assert.match(current, /Constitution v1\.0\.0.*not\s+present/is);
  assert.match(plan, /issues #2 and #3.*remain open/is);
  assert.doesNotMatch(current + plan, /BBNC-approved|BBNC-authorized|production-ready/i);
});

test("the implementation plan retains phases zero through ten in dependency order", async () => {
  const plan = await text(new URL("../implementation-plan.md", import.meta.url));
  let cursor = -1;
  for (let phase = 0; phase <= 10; phase += 1) {
    const next = plan.indexOf("## Phase " + phase + " ");
    assert.ok(next > cursor, "phase " + phase + " is missing or out of order");
    cursor = next;
  }
});

test("all architecture decisions remain proposed and authority-bounded", async () => {
  for (const url of adrUrls) {
    const body = await text(url);
    assert.match(body, /^# ADR \d+:/);
    assert.match(body, /Status: proposed/);
    assert.match(body, /authority|permission/i);
  }
});
