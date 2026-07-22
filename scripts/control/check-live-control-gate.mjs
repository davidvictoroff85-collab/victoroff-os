import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repository = "organvm/victoroff-os";

export function findSuccessfulControlReceipts(runs, mainSha) {
  const exactSuccessful = runs.filter(
    (run) => run.headSha === mainSha && run.status === "completed" && run.conclusion === "success",
  );
  const verify = exactSuccessful.find((run) => run.workflowName === "verify");
  const codeql = exactSuccessful.find((run) => run.workflowName.toLowerCase() === "codeql");
  return { verify, codeql };
}

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

function main() {
  const mainSha = gh(["api", `repos/${repository}/commits/main`, "--jq", ".sha"]);
  const runs = JSON.parse(gh([
    "run",
    "list",
    "--repo",
    repository,
    "--branch",
    "main",
    "--limit",
    "100",
    "--json",
    "headSha,status,conclusion,url,workflowName",
  ]));
  const receipts = findSuccessfulControlReceipts(runs, mainSha);
  if (!receipts.verify) {
    console.error(`FAIL: no successful verify.yml receipt exists for remote main ${mainSha}`);
    return 1;
  }
  if (!receipts.codeql) {
    console.error(`FAIL: no successful CodeQL receipt exists for remote main ${mainSha}`);
    return 1;
  }

  const encodedRegistry = gh([
    "api",
    `repos/${repository}/contents/program/registry.v1.json?ref=${mainSha}`,
    "--jq",
    ".content",
  ]);
  const registry = JSON.parse(Buffer.from(encodedRegistry.replace(/\n/g, ""), "base64").toString("utf8"));
  if (registry.schema_version !== "victoroff.program-registry.v1") {
    console.error(`FAIL: remote main ${mainSha} does not contain the control registry`);
    return 1;
  }
  if (!registry.gates.some((gate) => gate.id === "control-main-green")) {
    console.error("FAIL: remote control registry is missing control-main-green");
    return 1;
  }

  console.log(`PASS: control-main-green at ${mainSha} (verify: ${receipts.verify.url}; CodeQL: ${receipts.codeql.url})`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main();
