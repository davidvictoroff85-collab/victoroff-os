import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const registryUrl = new URL("../../program/registry.v1.json", import.meta.url);
const schemaUrl = new URL("../../packages/contracts/schemas/victoroff-program.v1.schema.json", import.meta.url);
const sourceUrl = new URL("../../program/sources/victoroff-brainstorm-20260722-tier-finance.v1.json", import.meta.url);
const tiersUrl = new URL("../../program/product/economic-agency-tiers.v1.json", import.meta.url);
const financeUrl = new URL("../../program/product/embedded-finance-reservation.v1.json", import.meta.url);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(hasText);
}

function patternPrefix(pattern) {
  return pattern.endsWith("/**") ? pattern.slice(0, -3) : null;
}

export function patternCovers(pattern, candidate) {
  const prefix = patternPrefix(pattern);
  if (prefix !== null) {
    const candidatePrefix = patternPrefix(candidate);
    return candidate === prefix || candidate.startsWith(`${prefix}/`) || candidatePrefix?.startsWith(`${prefix}/`);
  }
  return pattern === candidate;
}

export function patternsOverlap(left, right) {
  return patternCovers(left, right) || patternCovers(right, left);
}

export function validateSchemaShape(value, schema, path = "registry") {
  const errors = [];
  const typeMatches =
    !schema.type ||
    (schema.type === "object" && value !== null && typeof value === "object" && !Array.isArray(value)) ||
    (schema.type === "array" && Array.isArray(value));
  if (!typeMatches) return [`${path}: expected ${schema.type}`];
  if (Object.hasOwn(schema, "const") && value !== schema.const) errors.push(`${path}: expected constant ${schema.const}`);

  if (schema.type === "object") {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) errors.push(`${path}: missing required property ${required}`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(schema.properties ?? {}, key)) errors.push(`${path}: unexpected property ${key}`);
      }
    }
    for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) errors.push(...validateSchemaShape(value[key], propertySchema, `${path}.${key}`));
    }
  }

  if (schema.type === "array") {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: expected at least ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path}: expected at most ${schema.maxItems} items`);
    if (schema.items) {
      value.forEach((item, index) => errors.push(...validateSchemaShape(item, schema.items, `${path}[${index}]`)));
    }
  }
  return errors;
}

function findCycle(nodes, edges) {
  const state = new Map();
  const stack = [];

  function visit(node) {
    if (state.get(node) === "visiting") {
      const start = stack.indexOf(node);
      return [...stack.slice(start), node];
    }
    if (state.get(node) === "visited") return null;
    state.set(node, "visiting");
    stack.push(node);
    for (const dependency of edges.get(node) ?? []) {
      if (!nodes.has(dependency)) continue;
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(node, "visited");
    return null;
  }

  for (const node of nodes) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }
  return null;
}

export function validateRegistry(registry) {
  const errors = [];
  const expect = (condition, message) => {
    if (!condition) errors.push(message);
  };

  expect(registry?.schema_version === "victoroff.program-registry.v1", "schema_version must be victoroff.program-registry.v1");
  expect(registry?.program_id === "victoroff", "program_id must be victoroff");
  expect(registry?.authority?.mode === "uncommissioned_synthetic_only", "authority mode must remain uncommissioned_synthetic_only");
  for (const field of ["real_bbnc_data_allowed", "real_bbnc_identity_allowed", "representation_allowed"]) {
    expect(registry?.authority?.[field] === false, `authority.${field} must be false`);
  }
  expect(Array.isArray(registry?.authority?.holds) && registry.authority.holds.length >= 2, "authority holds must include issues #2 and #3");

  const expectedActions = ["start", "decide", "build", "release", "find-rule", "see-status", "understand"];
  const actionIds = (registry?.actions ?? []).map((action) => action.id);
  expect(JSON.stringify(actionIds) === JSON.stringify(expectedActions), "actions must be the seven ordered action-first entrances");

  const programs = new Map((registry?.programs ?? []).map((program) => [program.id, program]));
  expect(programs.size === 3, "registry must contain exactly the three additive programs");
  for (const id of ["victoroff-os", "shareholder-development", "victoroff-commercial"]) {
    expect(programs.has(id), `missing program ${id}`);
  }
  const commercial = programs.get("victoroff-commercial");
  expect(commercial?.repository === null, "victoroff-commercial repository must remain uncreated");
  expect(commercial?.visibility === "private", "victoroff-commercial must remain private");
  expect(commercial?.state === "authority_held", "victoroff-commercial must remain authority_held");

  const pathOwners = registry?.path_owners ?? [];
  const ownerIds = new Set();
  for (const rule of pathOwners) {
    expect(hasText(rule.id), "path owner id is required");
    expect(!ownerIds.has(rule.id), `duplicate path owner id ${rule.id}`);
    ownerIds.add(rule.id);
    expect(hasText(rule.owner), `${rule.id}: owner is required`);
    expect(isStringArray(rule.patterns), `${rule.id}: patterns must be a non-empty string array`);
  }

  const gates = new Map((registry?.gates ?? []).map((gate) => [gate.id, gate]));
  expect(gates.has("control-main-green"), "missing control-main-green gate");
  expect(gates.has("authority-ratified"), "missing authority-ratified gate");
  expect(gates.has("financial-product-authorized"), "missing financial-product-authorized gate");
  expect(gates.get("control-main-green")?.state === "derive_live", "control-main-green must be derived from live remote truth");
  for (const gate of gates.values()) {
    expect(hasText(gate.owner), `${gate.id}: gate owner is required`);
    expect(hasText(gate.predicate), `${gate.id}: gate predicate is required`);
    expect(hasText(gate.receipt_target), `${gate.id}: gate receipt target is required`);
  }

  const allIds = new Set([...actionIds, ...programs.keys(), ...ownerIds, ...gates.keys()]);
  const sourceInputs = registry?.source_inputs ?? [];
  for (const source of sourceInputs) {
    expect(hasText(source.id), "source input id is required");
    expect(!allIds.has(source.id), `duplicate global id ${source.id}`);
    allIds.add(source.id);
    expect(hasText(source.record), `${source.id}: source record is required`);
    expect(hasText(source.disposition), `${source.id}: source disposition is required`);
  }

  const extensions = new Map((registry?.product_extensions ?? []).map((extension) => [extension.id, extension]));
  const extensionIds = new Set(extensions.keys());
  const extensionEdges = new Map();
  for (const extension of extensions.values()) {
    expect(!allIds.has(extension.id), `duplicate global id ${extension.id}`);
    allIds.add(extension.id);
    expect(programs.has(extension.program_id), `${extension.id}: unknown program ${extension.program_id}`);
    expect(hasText(extension.state), `${extension.id}: state is required`);
    expect(hasText(extension.contract), `${extension.id}: contract is required`);
    expect(hasText(extension.owner), `${extension.id}: owner is required`);
    expect(Array.isArray(extension.dependencies), `${extension.id}: dependencies must be an array`);
    expect(hasText(extension.predicate), `${extension.id}: predicate is required`);
    expect(hasText(extension.receipt_target), `${extension.id}: receipt target is required`);
    extensionEdges.set(extension.id, (extension.dependencies ?? []).filter((dependency) => extensionIds.has(dependency)));
    for (const dependency of extension.dependencies ?? []) {
      expect(extensionIds.has(dependency) || gates.has(dependency), `${extension.id}: unknown dependency ${dependency}`);
    }
  }
  expect(extensions.has("economic-agency-tiers-v1"), "missing economic-agency-tiers-v1 extension");
  expect(extensions.has("embedded-finance-reservation-v1"), "missing embedded-finance-reservation-v1 extension");
  const extensionCycle = findCycle(extensionIds, extensionEdges);
  expect(!extensionCycle, `product extension dependency cycle ${extensionCycle?.join(" -> ")}`);

  const graphs = registry?.delivery_graphs ?? [];
  expect(graphs.length >= 1, "at least one delivery graph is required");
  for (const graph of graphs) {
    expect(!allIds.has(graph.id), `duplicate global id ${graph.id}`);
    allIds.add(graph.id);
    expect(programs.has(graph.program_id), `${graph.id}: unknown program ${graph.program_id}`);
    const phases = graph.phases ?? [];
    const phaseIds = new Set(phases.map((phase) => phase.id));
    const phaseEdges = new Map();
    let checkpointCount = 0;
    let provisionalCount = 0;

    for (const phase of phases) {
      expect(hasText(phase.owner), `${phase.id}: phase owner is required`);
      expect(isStringArray(phase.allowed_paths), `${phase.id}: allowed_paths are required`);
      expect(Array.isArray(phase.dependencies), `${phase.id}: dependencies must be an array`);
      expect(hasText(phase.predicate), `${phase.id}: predicate is required`);
      expect(hasText(phase.receipt_target), `${phase.id}: receipt_target is required`);
      phaseEdges.set(phase.id, phase.dependencies ?? []);
      for (const dependency of phase.dependencies ?? []) {
        expect(phaseIds.has(dependency) || gates.has(dependency), `${phase.id}: unknown dependency ${dependency}`);
      }
      for (const checkpoint of phase.checkpoints ?? []) {
        checkpointCount += 1;
        provisionalCount += checkpoint.claim === "provisional_verified" ? 1 : 0;
        expect(hasText(checkpoint.id), `${phase.id}: checkpoint id is required`);
        expect(!allIds.has(checkpoint.id), `duplicate global id ${checkpoint.id}`);
        allIds.add(checkpoint.id);
        expect(hasText(checkpoint.title), `${checkpoint.id}: title is required`);
        expect(["provisional_verified", "open", "authority_held"].includes(checkpoint.claim), `${checkpoint.id}: invalid claim ${checkpoint.claim}`);
      }
    }

    expect(checkpointCount === graph.checkpoint_total, `${graph.id}: declared ${graph.checkpoint_total} checkpoints but found ${checkpointCount}`);
    expect(provisionalCount === graph.provisional_claim_total, `${graph.id}: declared ${graph.provisional_claim_total} provisional claims but found ${provisionalCount}`);
    expect(graph.claim_state === "provisional_pending_checkpoint_predicates", `${graph.id}: claims must remain explicitly provisional`);
    const phaseCycle = findCycle(phaseIds, phaseEdges);
    expect(!phaseCycle, `${graph.id}: phase dependency cycle ${phaseCycle?.join(" -> ")}`);
  }

  const bbncGraph = graphs.find((graph) => graph.id === "bbnc-delivery-55-v1");
  expect(bbncGraph?.checkpoint_total === 55, "the preserved BBNC graph must contain 55 checkpoints");
  expect(bbncGraph?.provisional_claim_total === 12, "the imported PR #11 claim must remain 12 and provisional");

  const packets = registry?.work_packets ?? [];
  const packetIds = new Set(packets.map((packet) => packet.id));
  const packetEdges = new Map();
  const activePackets = [];
  let integrationPackets = 0;
  let activeIntegrationPackets = 0;
  const sharedPaths = ["AGENTS.md", ".github/**", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"];

  for (const packet of packets) {
    expect(hasText(packet.id), "packet id is required");
    expect(!allIds.has(packet.id), `duplicate global id ${packet.id}`);
    allIds.add(packet.id);
    expect(hasText(packet.objective), `${packet.id}: objective is required`);
    expect(hasText(packet.owner), `${packet.id}: owner is required`);
    expect(hasText(packet.target_agent), `${packet.id}: target_agent is required`);
    expect(["blocked", "ready", "in_progress", "done"].includes(packet.state), `${packet.id}: invalid state ${packet.state}`);
    expect(typeof packet.integration_packet === "boolean", `${packet.id}: integration_packet must be boolean`);
    expect(isStringArray(packet.allowed_paths), `${packet.id}: allowed_paths are required`);
    expect(isStringArray(packet.forbidden_paths), `${packet.id}: forbidden_paths are required`);
    expect(Array.isArray(packet.dependencies), `${packet.id}: dependencies must be an array`);
    expect(hasText(packet.predicate), `${packet.id}: predicate is required`);
    expect(hasText(packet.receipt_target), `${packet.id}: receipt_target is required`);
    packetEdges.set(packet.id, (packet.dependencies ?? []).filter((dependency) => packetIds.has(dependency)));

    for (const dependency of packet.dependencies ?? []) {
      expect(packetIds.has(dependency) || gates.has(dependency), `${packet.id}: unknown dependency ${dependency}`);
    }
    for (const allowed of packet.allowed_paths ?? []) {
      const matchingRules = pathOwners.filter((rule) => rule.patterns.some((pattern) => patternCovers(pattern, allowed)));
      expect(matchingRules.length > 0, `${packet.id}: no path owner covers ${allowed}`);
      expect(packet.integration_packet || matchingRules.some((rule) => rule.owner === packet.owner), `${packet.id}: owner ${packet.owner} does not own ${allowed}`);
      expect(!packet.forbidden_paths.some((forbidden) => patternsOverlap(allowed, forbidden)), `${packet.id}: ${allowed} overlaps a forbidden path`);
      expect(packet.integration_packet || !sharedPaths.some((shared) => patternsOverlap(allowed, shared)), `${packet.id}: only the integration packet may touch ${allowed}`);
    }
    if (packet.integration_packet) {
      integrationPackets += 1;
      if (["blocked", "ready", "in_progress"].includes(packet.state)) activeIntegrationPackets += 1;
    }
    if (["blocked", "ready", "in_progress"].includes(packet.state)) activePackets.push(packet);
  }

  expect(integrationPackets >= 1, "at least one integration packet is required");
  expect(activeIntegrationPackets <= 1, "at most one active integration packet is allowed");
  const packetCycle = findCycle(packetIds, packetEdges);
  expect(!packetCycle, `work packet dependency cycle ${packetCycle?.join(" -> ")}`);

  for (let index = 0; index < activePackets.length; index += 1) {
    for (let other = index + 1; other < activePackets.length; other += 1) {
      const left = activePackets[index];
      const right = activePackets[other];
      const collision = left.allowed_paths.some((leftPath) => right.allowed_paths.some((rightPath) => patternsOverlap(leftPath, rightPath)));
      expect(!collision, `active packet path collision: ${left.id} and ${right.id}`);
    }
  }

  const campaign = registry?.jules_campaign;
  expect(campaign?.state === "requires_live_control_main_green", "Jules campaign must derive control-main-green before launch");
  expect(campaign?.ordinary_start_limit === 96, "ordinary Jules start limit must preserve four recovery starts");
  expect(campaign?.recovery_reserve === 4, "Jules recovery reserve must be four");
  expect(campaign?.broad_dispatch_allowed === false, "broad Jules dispatch must remain disabled");
  expect(campaign?.parallel_above_one_allowed === false, "Jules parallelism above one must remain disabled");
  const envelopeTotal = Object.values(campaign?.daily_envelope ?? {}).reduce((sum, value) => sum + value, 0);
  expect(envelopeTotal === 100, `Jules daily envelope must total 100, found ${envelopeTotal}`);

  return errors;
}

export async function readRegistry(url = registryUrl) {
  return JSON.parse(await readFile(url, "utf8"));
}

export async function readSchema(url = schemaUrl) {
  return JSON.parse(await readFile(url, "utf8"));
}

export async function readBrainstormContracts() {
  const [source, tiers, finance] = await Promise.all(
    [sourceUrl, tiersUrl, financeUrl].map(async (url) => JSON.parse(await readFile(url, "utf8"))),
  );
  return { source, tiers, finance };
}

export function validateBrainstormContracts({ source, tiers, finance }) {
  const errors = [];
  const expect = (condition, message) => {
    if (!condition) errors.push(message);
  };

  expect(source?.schema_version === "victoroff.source-lineage.v1", "brainstorm source schema mismatch");
  expect(source?.id === "victoroff-brainstorm-20260722-tier-finance", "brainstorm source id mismatch");
  expect(source?.raw_source_tracked === false, "raw brainstorm must remain outside the tracked repository");
  expect(source?.sensitive_link_tracked === false, "sensitive brainstorm link must remain untracked");
  expect(source?.prompts?.length === 3, "brainstorm must preserve three prompt events");
  expect(source?.prompts?.some((prompt) => prompt.contracts?.includes("victoroff-commercial")), "commercial and official-deck intent must remain mapped");

  expect(tiers?.schema_version === "victoroff.economic-agency-tiers.v1", "tier contract schema mismatch");
  expect(tiers?.source_id === source?.id, "tier contract source lineage mismatch");
  expect(tiers?.financial_freedom_claim_mode === "measured_trajectory_not_guarantee", "financial freedom must remain a measured trajectory, not a guarantee");
  expect(JSON.stringify(tiers?.pillars?.map((pillar) => pillar.id)) === JSON.stringify(["money", "career", "assets", "systems", "ownership"]), "tier pillars must remain ordered Money through Ownership");
  expect(tiers?.tiers?.length === 5, "tier contract must contain five tiers");
  expect(JSON.stringify(tiers?.tiers?.map((tier) => tier.level)) === JSON.stringify([1, 2, 3, 4, 5]), "tier levels must be ordered 1 through 5");
  expect(tiers?.tiers?.[4]?.identity === "Business Owner", "Tier V must be Business Owner");
  expect(tiers?.unlock_contract?.percentages === "derived_only_from_sourced_fresh_metrics", "tier percentages must be evidence-derived");
  expect(tiers?.unlock_contract?.missing_data === "show_unknown_never_zero_or_invented", "missing tier data must remain unknown");
  expect(tiers?.unlock_contract?.required_output === "exactly_one_valid_next_action", "tier state must return one valid next action");

  expect(finance?.schema_version === "victoroff.embedded-finance-reservation.v1", "embedded-finance schema mismatch");
  expect(finance?.source_id === source?.id, "embedded-finance source lineage mismatch");
  expect(finance?.state === "future_regulated_layer", "embedded finance must remain a future regulated layer");
  expect(finance?.production_enabled === false, "embedded-finance production must remain disabled");
  expect(finance?.victoroff_is_bank === false, "Victoroff must not be represented as a bank");
  expect(finance?.roadmap?.[0] === "victoroff-os", "embedded-finance roadmap must begin with Victoroff OS");
  expect(finance?.gates?.length >= 8, "embedded finance requires the full product, legal, compliance, partner, security, claims, and exit gates");
  expect(finance?.claims_policy?.vendor_names === "discovered_and_validated_at_decision_time", "provider selection must remain live and unpinned");
  expect(finance?.claims_policy?.insurance_language === "forbidden_without_program_specific_legal_and_partner_receipts", "insurance language must fail closed");
  expect(finance?.implementation_boundary?.startsWith("No account, card, payment, credit, money movement"), "embedded-finance reservation must not authorize implementation");
  expect(!/Marqeta|FDIC insured/i.test(JSON.stringify({ source, tiers, finance })), "unverified vendor or insurance claims must not enter tracked contracts");
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const registry = await readRegistry();
  const schema = await readSchema();
  const contracts = await readBrainstormContracts();
  const errors = [
    ...validateSchemaShape(registry, schema),
    ...validateRegistry(registry),
    ...validateBrainstormContracts(contracts),
  ];
  if (errors.length > 0) {
    for (const error of errors) console.error(`FAIL: ${error}`);
    process.exit(1);
  }
  const graph = registry.delivery_graphs.find((candidate) => candidate.id === "bbnc-delivery-55-v1");
  console.log(`PASS: ${registry.programs.length} programs, ${graph.checkpoint_total} preserved checkpoints, ${registry.work_packets.length} bounded packets`);
}
