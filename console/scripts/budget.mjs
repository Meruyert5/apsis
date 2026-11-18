// Ship budget: the static site is mostly data and Three.js, so the raw
// JavaScript is the dataset. These ceilings fail CI when a change quietly
// ships a second copy, a texture, or a new dependency.
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const DIST = join(process.cwd(), "dist");
const BUDGET = {
  js: 3_200_000,
  css: 110_000,
  fonts: 180_000,
};

const size = async (dir) => {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    total += entry.isDirectory() ? await size(path) : (await stat(path)).size;
  }
  return total;
};

const assets = {};
for (const entry of await readdir(join(DIST, "assets"), { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const bytes = (await stat(join(DIST, "assets", entry.name))).size;
  if (entry.name.endsWith(".js")) assets.js = (assets.js ?? 0) + bytes;
  if (entry.name.endsWith(".css")) assets.css = (assets.css ?? 0) + bytes;
}
assets.fonts = await size(join(DIST, "fonts"));
assets.total = await size(DIST);

let failed = false;
for (const [key, limit] of Object.entries(BUDGET)) {
  const value = assets[key] ?? 0;
  const ok = value <= limit;
  if (!ok) failed = true;
  console.log(`${ok ? "ok  " : "FAIL"} ${key.padEnd(5)} ${(value / 1000).toFixed(1)}kB / ${(limit / 1000).toFixed(1)}kB`);
}
console.log(`     total ${(assets.total / 1000).toFixed(1)}kB`);

if (failed) process.exitCode = 1;
