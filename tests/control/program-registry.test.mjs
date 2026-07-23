import test from "node:test";
import assert from "node:assert/strict";
import {
  readBrainstormContracts,
  readIntelligenceDirective,
  readWhaleDirective,
  readRegistry,
  readSchema,
  validateBrainstormContracts,
  validateIntelligenceDirective,
  validateWhaleDirective,
  validateRegistry,
  validateSchemaShape,
} from "../../scripts/control/validate-program-registry.mjs";

test("the checked-in registry satisfies semantic controls", async () => {
  const registry = await readRegistry();
  const schema = await readSchema();
  assert.deepEqual(validateSchemaShape(registry, schema), []);
  assert.deepEqual(validateRegistry(registry), []);
});

test("the brainstorm contracts preserve tier and finance boundaries", async () => {
  assert.deepEqual(validateBrainstormContracts(await readBrainstormContracts()), []);
});

test("the intelligence directive remains synthetic, subordinate, and provenance-first", async () => {
  assert.deepEqual(validateIntelligenceDirective(await readIntelligenceDirective()), []);
});

test("the intelligence directive cannot invent constitutional availability or real-data authority", async () => {
  const source = structuredClone(await readIntelligenceDirective());
  source.governing_source_available = true;
  source.real_bbnc_data_allowed = true;
  const errors = validateIntelligenceDirective(source);
  assert.ok(errors.some((error) => error.includes("missing Constitution source")));
  assert.ok(errors.some((error) => error.includes("real_bbnc_data_allowed must be false")));
});

test("the whale directive remains singular, bounded, accessible, and subordinate", async () => {
  assert.deepEqual(validateWhaleDirective(await readWhaleDirective()), []);
});

test("the whale directive rejects per-page ownership and theatrical timing", async () => {
  const source = structuredClone(await readWhaleDirective());
  source.provider_owner = "individual-pages";
  source.normal_timing_ms.maximum = 4000;
  source.excluded_interactions = [];
  const errors = validateWhaleDirective(source);
  assert.ok(errors.some((error) => error.includes("one provider owner")));
  assert.ok(errors.some((error) => error.includes("maximum must be 1000ms")));
  assert.ok(errors.some((error) => error.includes("same-page anchors must remain immediate")));
});

test("fabricated tier progress and premature finance production are rejected", async () => {
  const contracts = structuredClone(await readBrainstormContracts());
  contracts.tiers.unlock_contract.percentages = "invented_by_model";
  contracts.finance.production_enabled = true;
  const errors = validateBrainstormContracts(contracts);
  assert.ok(errors.some((error) => error.includes("percentages must be evidence-derived")));
  assert.ok(errors.some((error) => error.includes("production must remain disabled")));
});

test("the schema rejects a missing required registry surface", async () => {
  const registry = structuredClone(await readRegistry());
  const schema = await readSchema();
  delete registry.work_packets;
  assert.ok(validateSchemaShape(registry, schema).some((error) => error.includes("missing required property work_packets")));
});

test("the legacy graph count is derived from named checkpoints", async () => {
  const registry = await readRegistry();
  const graph = registry.delivery_graphs.find((candidate) => candidate.id === "bbnc-delivery-55-v1");
  const checkpoints = graph.phases.flatMap((phase) => phase.checkpoints);
  assert.equal(checkpoints.length, 55);
  assert.equal(checkpoints.filter((checkpoint) => checkpoint.claim === "provisional_verified").length, 12);
  assert.match(graph.claim_state, /^provisional_/);
});

test("commercial custody cannot be invented", async () => {
  const registry = structuredClone(await readRegistry());
  registry.programs.find((program) => program.id === "victoroff-commercial").repository = "invented/victoroff-commercial";
  assert.ok(validateRegistry(registry).some((error) => error.includes("must remain uncreated")));
});

test("packet path collisions are rejected", async () => {
  const registry = structuredClone(await readRegistry());
  const contract = registry.work_packets.find((packet) => packet.id === "VIC-CONTRACT-001");
  const domain = registry.work_packets.find((packet) => packet.id === "VIC-DOMAIN-001");
  contract.state = "ready";
  domain.state = "ready";
  domain.allowed_paths = ["packages/contracts/**"];
  domain.owner = "victoroff-contracts";
  const errors = validateRegistry(registry);
  assert.ok(errors.some((error) => error.includes("VIC-CONTRACT-001 and VIC-DOMAIN-001")));
});

test("unknown dependencies and cycles are rejected", async () => {
  const registry = structuredClone(await readRegistry());
  const contract = registry.work_packets.find((packet) => packet.id === "VIC-CONTRACT-001");
  const domain = registry.work_packets.find((packet) => packet.id === "VIC-DOMAIN-001");
  contract.dependencies = ["VIC-DOMAIN-001"];
  domain.dependencies = ["VIC-CONTRACT-001"];
  const errors = validateRegistry(registry);
  assert.ok(errors.some((error) => error.includes("dependency cycle")));
});

test("historical integration packets coexist but active integration remains single-writer", async () => {
  const registry = structuredClone(await readRegistry());
  const historical = structuredClone(registry.work_packets.find((packet) => packet.id === "VIC-PR11-INTEGRATE"));
  historical.id = "VIC-HISTORICAL-INTEGRATION";
  historical.state = "done";
  historical.allowed_paths = ["docs/program/historical-integration.md"];
  registry.work_packets.push(historical);
  assert.deepEqual(validateRegistry(registry), []);

  historical.state = "ready";
  assert.ok(validateRegistry(registry).some((error) => error.includes("at most one active integration packet")));
});

test("the contracts canary predicate runs tests before typechecking", async () => {
  const registry = await readRegistry();
  const packet = registry.work_packets.find((candidate) => candidate.id === "VIC-CONTRACT-001");
  assert.equal(
    packet.predicate,
    "pnpm --filter @victoroff/contracts test && pnpm --filter @victoroff/contracts typecheck",
  );
});

test("merged canaries and the first institutional intelligence dependency chain are reconciled", async () => {
  const registry = await readRegistry();
  for (const id of ["VIC-GOV-001", "VIC-CONTRACT-001", "VIC-DOMAIN-001", "VIC-INTEL-CONTROL-001", "VIC-INTEL-DOCS-001"]) {
    assert.equal(registry.work_packets.find((packet) => packet.id === id)?.state, "done");
  }
  assert.deepEqual(
    ["VIC-GOV-001", "VIC-CONTRACT-001", "VIC-DOMAIN-001"].map(
      (id) => registry.work_packets.find((packet) => packet.id === id)?.receipt_target,
    ),
    [
      "github://organvm/victoroff-os/pulls/18",
      "github://organvm/victoroff-os/pulls/19",
      "github://organvm/victoroff-os/pulls/20",
    ],
  );
  assert.equal(
    registry.work_packets.find((packet) => packet.id === "VIC-INTEL-DOCS-001")?.receipt_target,
    "github://organvm/victoroff-os/pulls/22",
  );
  assert.deepEqual(
    registry.work_packets.find((packet) => packet.id === "VIC-WHALE-ENGINE-001")?.dependencies,
    ["VIC-INTEL-DOCS-001"],
  );
  assert.equal(registry.work_packets.find((packet) => packet.id === "VIC-WHALE-ENGINE-001")?.state, "done");
  assert.equal(
    registry.work_packets.find((packet) => packet.id === "VIC-WHALE-ENGINE-001")?.receipt_target,
    "github://organvm/victoroff-os/pulls/24",
  );
  assert.deepEqual(
    registry.work_packets.find((packet) => packet.id === "VIC-INTEL-DOCS-001")?.dependencies,
    ["VIC-INTEL-CONTROL-001"],
  );
  assert.deepEqual(
    registry.work_packets.find((packet) => packet.id === "VIC-INTEL-CONTRACTS-001")?.dependencies,
    ["VIC-INTEL-DOCS-001"],
  );
  assert.deepEqual(
    registry.work_packets.find((packet) => packet.id === "VIC-INTEL-PERSISTENCE-001")?.dependencies,
    ["VIC-INTEL-CONTRACTS-001"],
  );
});
