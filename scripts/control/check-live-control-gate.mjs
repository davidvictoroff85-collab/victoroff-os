import { execFileSync } from "node:child_process";

const repository = "organvm/victoroff-os";

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

const mainSha = gh(["api", `repos/${repository}/commits/main`, "--jq", ".sha"]);
const runs = JSON.parse(gh([
  "run",
  "list",
  "--repo",
  repository,
  "--workflow",
  "verify.yml",
  "--branch",
  "main",
  "--limit",
  "20",
  "--json",
  "headSha,status,conclusion,url",
]));
const exactRun = runs.find((run) => run.headSha === mainSha && run.status === "completed" && run.conclusion === "success");
if (!exactRun) {
  console.error(`FAIL: no successful verify.yml receipt exists for remote main ${mainSha}`);
  process.exit(1);
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
  process.exit(1);
}
if (!registry.gates.some((gate) => gate.id === "control-main-green")) {
  console.error("FAIL: remote control registry is missing control-main-green");
  process.exit(1);
}

console.log(`PASS: control-main-green at ${mainSha} (${exactRun.url})`);
