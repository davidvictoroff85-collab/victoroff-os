import { fileURLToPath } from "node:url";

export const SHARD_NAMES = ["scope", "control", "docs", "code", "browser", "release"];

export function checkShardResults(results) {
  const failures = [];
  for (const name of SHARD_NAMES) {
    const result = results[name];
    const accepted = name === "scope" ? result === "success" : result === "success" || result === "skipped";
    if (!accepted) {
      failures.push(`${name}=${result || "missing"}`);
    }
  }
  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = Object.fromEntries(
    SHARD_NAMES.map((name) => [name, process.env[`${name.toUpperCase()}_RESULT`]]),
  );
  const failures = checkShardResults(results);
  if (failures.length > 0) {
    console.error(`FAIL: implicated CI shard did not pass: ${failures.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("PASS: all implicated CI shards succeeded or were intentionally skipped");
  }
}
