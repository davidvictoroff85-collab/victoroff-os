import { cp, mkdir, rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const destination = new URL("./dist/site/", root);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(new URL("./apps/site/dist/", root), destination, { recursive: true });
console.log("PASS: staged apps/site/dist at dist/site");
