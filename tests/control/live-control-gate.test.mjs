import test from "node:test";
import assert from "node:assert/strict";
import { findSuccessfulControlReceipts } from "../../scripts/control/check-live-control-gate.mjs";

const mainSha = "a".repeat(40);
const successful = (workflowName, headSha = mainSha) => ({
  workflowName,
  headSha,
  status: "completed",
  conclusion: "success",
  url: `https://example.invalid/${workflowName}`,
});

test("control-main-green requires exact-main verify and CodeQL receipts", () => {
  const receipts = findSuccessfulControlReceipts([successful("verify"), successful("CodeQL")], mainSha);
  assert.equal(receipts.verify.workflowName, "verify");
  assert.equal(receipts.codeql.workflowName, "CodeQL");
});

test("stale or failed CodeQL evidence does not release the gate", () => {
  const stale = successful("CodeQL", "b".repeat(40));
  const failed = { ...successful("CodeQL"), conclusion: "failure" };
  assert.equal(findSuccessfulControlReceipts([successful("verify"), stale], mainSha).codeql, undefined);
  assert.equal(findSuccessfulControlReceipts([successful("verify"), failed], mainSha).codeql, undefined);
});

test("unnamed successful runs do not prevent exact CodeQL receipt matching", () => {
  const unnamed = successful(undefined);
  const receipts = findSuccessfulControlReceipts([unnamed, successful("verify"), successful("CodeQL")], mainSha);
  assert.equal(receipts.verify.workflowName, "verify");
  assert.equal(receipts.codeql.workflowName, "CodeQL");
});
