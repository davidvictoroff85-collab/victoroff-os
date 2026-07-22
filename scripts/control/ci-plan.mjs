import { appendFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function classifyChangedFiles(files) {
  const scopes = {
    control: false,
    docs: false,
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
      (path.startsWith("docs/") && !path.startsWith("docs/governance/") && !path.startsWith("docs/finance/")) ||
      path === "README.md" ||
      path === "design-qa.md" ||
      path === "packages/contracts/schemas/victoroff-program.v1.schema.json"
    ) {
      scopes.control = true;
    }

    if (path.startsWith("docs/governance/") || path.startsWith("docs/finance/")) {
      scopes.docs = true;
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

export function planChangedFiles(files) {
  const normalizedFiles = files.map((path) => path.trim()).filter(Boolean);
  const scopes = classifyChangedFiles(normalizedFiles);
  const unclassified = normalizedFiles.filter((path) => {
    const fileScopes = classifyChangedFiles([path]);
    return !Object.values(fileScopes).some(Boolean);
  });
  return { files: normalizedFiles, scopes, unclassified };
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
  const plan = planChangedFiles(files);
  const output = argument("--github-output");
  if (output) {
    await appendFile(output, Object.entries(plan.scopes).map(([name, enabled]) => `${name}=${enabled}\n`).join(""));
  }
  console.log(JSON.stringify(plan));
  if (plan.unclassified.length > 0) {
    console.error(`FAIL: nonempty diff contains unclassified paths: ${plan.unclassified.join(", ")}`);
    process.exitCode = 1;
  }
}
