import test from "node:test";
import assert from "node:assert/strict";
import {
  readRegistry,
  readSchema,
  validateRegistry,
  validateSchemaShape,
} from "../../scripts/control/validate-program-registry.mjs";

test("the checked-in registry satisfies semantic controls", async () => {
  const registry = await readRegistry();
  const schema = await readSchema();
  assert.deepEqual(validateSchemaShape(registry, schema), []);
  assert.deepEqual(validateRegistry(registry), []);
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
  registry.work_packets.find((packet) => packet.id === "VIC-DOMAIN-001").allowed_paths = ["packages/contracts/**"];
  registry.work_packets.find((packet) => packet.id === "VIC-DOMAIN-001").owner = "victoroff-contracts";
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
