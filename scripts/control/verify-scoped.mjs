import { spawnSync } from "node:child_process";
import { changedFiles, planChangedFiles } from "./ci-plan.mjs";

const baseIndex = process.argv.indexOf("--base");
const base = baseIndex >= 0 ? process.argv[baseIndex + 1] : process.env.VICTOROFF_VERIFY_BASE ?? "origin/main";
const head = "HEAD";
const files = changedFiles(base, head);
const { scopes, unclassified } = planChangedFiles(files);
const commands = [];

if (unclassified.length > 0) {
  console.error(`FAIL: nonempty diff contains unclassified paths: ${unclassified.join(", ")}`);
  process.exit(1);
}

if (scopes.control) commands.push(["pnpm", ["verify:control"]]);
if (scopes.docs) commands.push(["node", ["scripts/control/run-doc-tests.mjs"]]);
if (scopes.code) {
  commands.push(
    ["pnpm", ["lint"]],
    ["pnpm", ["typecheck"]],
    ["pnpm", ["test"]],
    ["pnpm", ["build"]],
  );
}
if (scopes.browser) {
  commands.push(["pnpm", ["test:a11y"]], ["pnpm", ["test:e2e"]]);
}
if (scopes.release) commands.push(["pnpm", ["run", "cloudflare:dry-run"]]);

console.log(`Scoped files: ${files.length ? files.join(", ") : "none"}`);
console.log(`Scoped gates: ${Object.entries(scopes).filter(([, enabled]) => enabled).map(([name]) => name).join(", ") || "none"}`);

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
