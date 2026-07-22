import { appendFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function classifyChangedFiles(files) {
  const scopes = {
    control: false,
    code: false,
    browser: false,
    release: false,
  };

  for (const path of files) {
    if (
      path === "AGENTS.md" ||
      path === "package.json" ||
      path === "pnpm-lock.yaml" ||
      path === "pnpm-workspace.yaml" ||
      path.startsWith(".github/") ||
      path.startsWith("program/") ||
      path.startsWith("scripts/control/") ||
      path.startsWith("tests/control/") ||
      path.startsWith("docs/program/") ||
      path.startsWith("docs/continuations/") ||
      path === "packages/contracts/schemas/victoroff-program.v1.schema.json"
    ) {
      scopes.control = true;
    }

    if (
      path === "package.json" ||
      path === "pnpm-lock.yaml" ||
      path === "pnpm-workspace.yaml" ||
      path === "tsconfig.base.json" ||
      path === "vitest.config.ts" ||
      path.startsWith("apps/") ||
      path.startsWith("packages/") ||
      path.startsWith("services/") ||
      path === "scripts/lint.mjs" ||
      path === "scripts/stage-site.mjs"
    ) {
      scopes.code = true;
    }

    if (
      path === "package.json" ||
      path === "pnpm-lock.yaml" ||
      path.startsWith("apps/site/") ||
      path.startsWith("tests/e2e/") ||
      path.startsWith("tests/a11y/") ||
      path.startsWith("playwright")
    ) {
      scopes.browser = true;
    }

    if (
      path === "package.json" ||
      path === "pnpm-lock.yaml" ||
      path === "wrangler.jsonc" ||
      path === "vercel.json" ||
      path.startsWith("apps/site/") ||
      path === "scripts/stage-site.mjs"
    ) {
      scopes.release = true;
    }
  }

  return scopes;
}

export function changedFiles(base, head) {
  if (!base || !head || /^0+$/.test(base)) return ["package.json"];
  try {
    const output = execFileSync("git", ["diff", "--name-only", `${base}...${head}`], { encoding: "utf8" });
    return output.split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    return ["package.json"];
  }
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const filesArgument = argument("--files");
  const files = filesArgument ? filesArgument.split(",").filter(Boolean) : changedFiles(argument("--base"), argument("--head"));
  const scopes = classifyChangedFiles(files);
  const output = argument("--github-output");
  if (output) {
    await appendFile(output, Object.entries(scopes).map(([name, enabled]) => `${name}=${enabled}\n`).join(""));
  }
  console.log(JSON.stringify({ files, scopes }));
}
