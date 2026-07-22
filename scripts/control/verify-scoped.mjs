import { spawnSync } from "node:child_process";
import { changedFiles, classifyChangedFiles } from "./ci-plan.mjs";

const baseIndex = process.argv.indexOf("--base");
const base = baseIndex >= 0 ? process.argv[baseIndex + 1] : process.env.VICTOROFF_VERIFY_BASE ?? "origin/main";
const head = "HEAD";
const files = changedFiles(base, head);
const scopes = classifyChangedFiles(files);
const commands = [];

if (scopes.control) commands.push(["pnpm", ["verify:control"]]);
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
