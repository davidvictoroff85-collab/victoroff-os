import { readFile } from "node:fs/promises";

const url = new URL("../../docs/continuations/victoroff-canary-campaign-20260722/workstream.json", import.meta.url);
const receipt = JSON.parse(await readFile(url, "utf8"));
const errors = [];
const expect = (condition, message) => {
  if (!condition) errors.push(message);
};

expect(receipt.schema === "limen.workstream.receipt.v1", "receipt schema mismatch");
expect(receipt.from === "origin/main", "continuation must derive from live origin/main");
expect(receipt.control_receipt === "https://github.com/organvm/victoroff-os/pull/12", "exact durable control PR receipt is required");
expect(receipt.contract?.schema === "limen.workstream.contract.v1", "contract schema mismatch");
const runway = receipt.contract?.runway;
expect(Number.isInteger(runway?.duration_seconds) && runway.duration_seconds > 0, "finite positive runway is required");
expect(runway?.deadline_epoch - runway?.started_epoch === runway?.duration_seconds, "runway epochs must agree with duration");
expect(receipt.contract?.authorization?.approval_mode === "never", "bounded work must not create approval modals");
expect(receipt.contract?.authorization?.retained_gates?.includes("client_authority"), "client authority gate must be retained");
expect(receipt.contract?.conductor?.provider_and_model === "provider_neutral", "continuation must remain provider neutral");
expect(receipt.contract?.conductor?.boundary_rule === "recheck_remaining_runway_before_each_packet", "packet-boundary runway check is required");

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL: ${error}`);
  process.exit(1);
}
console.log(`PASS: finite ${runway.requested} continuation from ${receipt.from}`);
