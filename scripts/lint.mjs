import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const errors = [];

async function filesBelow(relativeRoot, suffixes) {
  const start = fileURLToPath(new URL(relativeRoot, root));
  const found = [];
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (["node_modules", "dist", "test-results", ".git"].includes(entry.name)) continue;
      const child = join(path, entry.name);
      if (entry.isDirectory()) await walk(child);
      else if (suffixes.some((suffix) => entry.name.endsWith(suffix))) found.push(child);
    }
  }
  await walk(start);
  return found;
}

const sourceFiles = await filesBelow("./", [".ts", ".mjs", ".html", ".css", ".json", ".yaml"]);
for (const path of sourceFiles) {
  const text = await readFile(path, "utf8");
  const rel = relative(rootPath, path);
  if (/\t/.test(text)) errors.push(`${rel}: tabs are not permitted`);
  if (/ +$/m.test(text)) errors.push(`${rel}: trailing whitespace`);
}

const cssFiles = await filesBelow("./apps", [".css"]);
for (const path of [...cssFiles, ...(await filesBelow("./packages/ui", [".css"]))]) {
  const css = await readFile(path, "utf8");
  const rel = relative(rootPath, path);
  for (const banned of ["gradient(", "box-shadow", "text-shadow", "drop-shadow", "filter:", "@font-face"]) {
    if (css.toLowerCase().includes(banned)) errors.push(`${rel}: banned visual token ${banned}`);
  }
  const hexes = css.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
  for (const value of hexes) {
    if (!["#000", "#000000", "#fff", "#ffffff"].includes(value.toLowerCase())) {
      errors.push(`${rel}: non-black/white color ${value}`);
    }
  }
  const rgbValues = css.match(/rgba?\([^)]*\)|rgb\([^)]*\)/gi) ?? [];
  for (const value of rgbValues) {
    const numbers = value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
    const monochrome = numbers.length === 3 && (numbers.every((n) => n === 0) || numbers.every((n) => n === 255));
    if (!monochrome) errors.push(`${rel}: non-black/white RGB color ${value}`);
  }
}

const htmlPath = new URL("./apps/site/index.html", root);
const html = await readFile(htmlPath, "utf8");
for (const required of [
  'content="noindex, nofollow"',
  "Uncommissioned concept",
  "Public and synthetic information only",
  'id="main"',
  "Skip to content",
]) {
  if (!html.includes(required)) errors.push(`apps/site/index.html: missing ${required}`);
}
if (/fonts\.(googleapis|gstatic)\.com|<link[^>]+font/i.test(html)) {
  errors.push("apps/site/index.html: external web fonts are forbidden");
}

const actions = JSON.parse(await readFile(new URL("./packages/fixtures/src/actions.json", root), "utf8"));
const today = new Date();
for (const action of actions) {
  if (action.schemaVersion !== "shareholder-action.v1") errors.push(`${action.id}: schemaVersion mismatch`);
  if (action.classification !== "public") errors.push(`${action.id}: content is not classified public`);
  if (!Array.isArray(action.preparation) || action.preparation.length === 0) errors.push(`${action.id}: preparation is empty`);
  for (const key of ["rule", "ownerSystem", "handoff", "fallback", "source", "reviewedAt", "expiresAt"]) {
    if (!action[key]) errors.push(`${action.id}: missing ${key}`);
  }
  if (new Date(`${action.expiresAt}T23:59:59Z`) < today) errors.push(`${action.id}: source record expired ${action.expiresAt}`);
  if (!html.includes(`data-action-result="${action.id}"`)) errors.push(`${action.id}: missing no-JavaScript result`);
  if (!html.includes(`href="${action.handoff.url}"`)) errors.push(`${action.id}: handoff is missing from static HTML`);
}

const sitePackage = JSON.parse(await readFile(new URL("./apps/site/package.json", root), "utf8"));
for (const forbidden of ["@victoroff/domain", "@victoroff/publication"]) {
  if (sitePackage.dependencies?.[forbidden]) errors.push(`apps/site: forbidden dependency ${forbidden}`);
}
for (const path of await filesBelow("./apps/site/src", [".ts"])) {
  const source = await readFile(path, "utf8");
  if (/from\s+["']@victoroff\/(domain|publication)/.test(source)) {
    errors.push(`apps/site: forbidden internal import in ${path}`);
  }
}

const robots = await readFile(new URL("./apps/site/public/robots.txt", root), "utf8");
if (!robots.includes("Disallow: /")) errors.push("apps/site/public/robots.txt: crawling must be disallowed");

const vercel = JSON.parse(await readFile(new URL("./vercel.json", root), "utf8"));
if (vercel.outputDirectory !== "dist/site") errors.push("vercel.json: public site must be the only deployed output");
if (!JSON.stringify(vercel.headers).includes("noindex, nofollow")) errors.push("vercel.json: noindex header missing");

if (errors.length) {
  for (const error of errors) console.error(`FAIL: ${error}`);
  process.exit(1);
}

console.log(`PASS: policy and source checks (${sourceFiles.length} files, ${actions.length} public actions)`);
