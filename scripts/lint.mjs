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

const sourceFiles = await filesBelow("./", [".ts", ".mjs", ".html", ".css", ".json", ".jsonc", ".yaml"]);
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

const packageJson = JSON.parse(await readFile(new URL("./package.json", root), "utf8"));
if (packageJson.packageManager !== "pnpm@10.34.4") errors.push("package.json: pnpm must be pinned to 10.34.4");
if (packageJson.engines?.node !== "24.x") errors.push("package.json: Node must be pinned to major 24");
if (packageJson.devDependencies?.wrangler !== "4.104.0") errors.push("package.json: Wrangler must be pinned to 4.104.0");
const nodeVersion = (await readFile(new URL("./.node-version", root), "utf8")).trim();
if (nodeVersion !== "24") errors.push(".node-version: expected Node 24");

const wrangler = JSON.parse(await readFile(new URL("./wrangler.jsonc", root), "utf8"));
const allowedWranglerKeys = ["$schema", "assets", "compatibility_date", "name", "preview_urls", "workers_dev"];
for (const key of Object.keys(wrangler)) {
  if (!allowedWranglerKeys.includes(key)) errors.push(`wrangler.jsonc: runtime or binding key is forbidden: ${key}`);
}
if (wrangler.name !== "victoroff-os") errors.push("wrangler.jsonc: Worker name must be victoroff-os");
if (wrangler.compatibility_date !== "2026-07-21") errors.push("wrangler.jsonc: compatibility date mismatch");
if (wrangler.workers_dev !== true || wrangler.preview_urls !== true) {
  errors.push("wrangler.jsonc: workers.dev and preview URLs must be enabled");
}
const expectedAssets = {
  directory: "./dist/site",
  not_found_handling: "none",
  html_handling: "auto-trailing-slash",
};
if (JSON.stringify(wrangler.assets) !== JSON.stringify(expectedAssets)) {
  errors.push("wrangler.jsonc: static asset boundary mismatch");
}

const cloudflareHeaders = await readFile(new URL("./apps/site/public/_headers", root), "utf8");
for (const required of [
  "/*",
  "X-Robots-Tag: noindex, nofollow",
  "X-Content-Type-Options: nosniff",
  "Referrer-Policy: strict-origin-when-cross-origin",
  "Permissions-Policy: camera=(), microphone=(), geolocation=()",
]) {
  if (!cloudflareHeaders.includes(required)) errors.push(`apps/site/public/_headers: missing ${required}`);
}

const vercel = JSON.parse(await readFile(new URL("./vercel.json", root), "utf8"));
if (vercel.outputDirectory !== "dist/site") errors.push("vercel.json: public site must be the only deployed output");
const vercelHeaders = JSON.stringify(vercel.headers);
for (const required of [
  "noindex, nofollow",
  "nosniff",
  "strict-origin-when-cross-origin",
  "camera=(), microphone=(), geolocation=()",
]) {
  if (!vercelHeaders.includes(required)) errors.push(`vercel.json: frozen rollback header missing ${required}`);
}

if (errors.length) {
  for (const error of errors) console.error(`FAIL: ${error}`);
  process.exit(1);
}

console.log(`PASS: policy and source checks (${sourceFiles.length} files, ${actions.length} public actions)`);
