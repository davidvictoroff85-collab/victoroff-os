import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const siteUrl = new URL("../../apps/site/index.html", import.meta.url);

export function validatePrimaryNavigation(html) {
  const errors = [];
  const match = html.match(/<nav\s+aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/i);
  if (!match) return ["apps/site/index.html: primary navigation is missing"];
  const nav = match[1];
  const forbiddenTargets = ["#delivery", "#phases", "#measurement", "#outcomes", "#checkpoints"];
  for (const target of forbiddenTargets) {
    if (new RegExp(`href=["']${target}["']`, "i").test(nav)) {
      errors.push(`apps/site/index.html: detailed evidence target ${target} is forbidden in primary navigation`);
    }
  }
  if (/\b(phases?|outcomes?|checkpoints?|delivery status)\b/i.test(nav)) {
    errors.push("apps/site/index.html: detailed delivery evidence is forbidden in primary navigation");
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = validatePrimaryNavigation(await readFile(siteUrl, "utf8"));
  if (errors.length > 0) {
    for (const error of errors) console.error(`FAIL: ${error}`);
    process.exit(1);
  }
  console.log("PASS: primary navigation remains action-first and excludes detailed delivery evidence");
}
