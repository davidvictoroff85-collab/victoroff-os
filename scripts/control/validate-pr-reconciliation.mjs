import { readFile } from "node:fs/promises";

const url = new URL("../../program/reconciliations/pr-11.v1.json", import.meta.url);
const record = JSON.parse(await readFile(url, "utf8"));
const errors = [];
const expect = (condition, message) => {
  if (!condition) errors.push(message);
};

expect(record.schema_version === "victoroff.pr-reconciliation.v1", "schema version mismatch");
expect(record.repository === "organvm/victoroff-os", "repository mismatch");
expect(record.pull_request === 11, "pull request must be 11");
expect(record.owner === "4444J99", "PR owner must be preserved");
expect(record.base?.sha === "28c797907050827c16044baa63d7c63fe9c94f25", "audited base SHA mismatch");
expect(record.head?.sha === "b2f30038611b16e33c488a1fa701de9599c05cce", "audited head SHA mismatch");
expect(record.dependency === "control-main-green", "PR #11 must depend on the merged control gate");
expect(record.source_claim?.credit_state === "provisional_pending_checkpoint_predicates", "PR #11 claims must remain provisional");
expect(record.source_claim?.checkpoint_total === 55, "PR #11 source total must remain 55");
expect(record.source_claim?.provisional_claim_total === 12, "PR #11 provisional claim must remain 12");
expect(record.owner_rules?.overwrite_owner_branch === false, "owner branch overwrite must remain forbidden");
expect(record.owner_rules?.force_push === false, "force push must remain forbidden");
expect(record.owner_rules?.close_before_patch_equivalence === false, "premature close must remain forbidden");

const expectedPaths = ["apps/site/index.html", "apps/site/src/site.css", "tests/e2e/action-center.spec.ts"];
expect(JSON.stringify(record.files?.map((file) => file.path)) === JSON.stringify(expectedPaths), "PR #11 changed-path inventory mismatch");
for (const file of record.files ?? []) {
  expect(typeof file.disposition === "string" && file.disposition.length > 0, `${file.path}: disposition is required`);
  expect(Array.isArray(file.preserve) && file.preserve.length > 0, `${file.path}: preserve list is required`);
  expect(typeof file.required_change === "string" && file.required_change.length > 0, `${file.path}: required change is required`);
}
expect(record.predicate === "pnpm verify:scoped", "reconciliation predicate mismatch");
expect(record.receipt_target === record.url, "reconciliation receipt must remain PR #11");

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL: ${error}`);
  process.exit(1);
}
console.log(`PASS: PR #11 reconciliation preserves owner ${record.owner} and ${record.files.length} changed paths`);
