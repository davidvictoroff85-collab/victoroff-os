import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function discoverTrackedDocTests({ cwd = process.cwd() } = {}) {
  const output = execFileSync("git", ["ls-files", "-z", "--", "docs/**/*.test.mjs"], {
    cwd,
    encoding: "utf8",
  });
  return output.split("\0").filter(Boolean).sort();
}

export function requireTrackedDocTests(files) {
  if (files.length === 0) {
    throw new Error("documentation test shard was selected but no tracked docs/**/*.test.mjs files exist");
  }
  return files;
}

export function runTrackedDocTests({ cwd = process.cwd(), spawn = spawnSync } = {}) {
  const files = requireTrackedDocTests(discoverTrackedDocTests({ cwd }));
  const result = spawn(process.execPath, ["--test", ...files], { cwd, stdio: "inherit" });
  return result.status ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runTrackedDocTests();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
