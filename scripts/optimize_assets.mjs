// Makes the images the game uses small enough to load quickly on slow phones and connections.
//
// Every image referenced from app/, lib/ or data/ is re-encoded as WebP next to its source
// (foo.png -> foo.webp), shrunk to the largest size it is shown at, and the reference is pointed at
// the .webp. The PNG/JPG sources stay in place as the originals, so this can be re-run any time
// (for example after scripts/extract_art.mjs writes new art).
//
// Run:  node scripts/optimize_assets.mjs

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC = path.join(ROOT, "public");
const SOURCES = ["app", "lib", "data"];
const REF = /\/assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp)/g;

// Longest side, in pixels, for images that are always shown smaller than they were drawn.
function maxSize(url) {
  if (url.includes("/icons/")) return 256; // ingredient bins are 64–80px, tools in the step card ~60px
  if (/\/assets\/food\/r\d\.jpg|\/assets\/food\/r\d\.webp/.test(url)) return 900; // level covers on the select cards
  if (url.includes("/avatars/")) return 768;
  return null; // sprite sheets, plate layers and scenes are used close to full size
}

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? filesIn(p) : /\.(tsx?|json)$/.test(d.name) ? [p] : [];
  });
}

// The original a reference points at: itself, or for a .webp reference the PNG/JPG it was made from.
function sourceOf(url) {
  const base = url.replace(/\.(png|jpe?g|webp)$/, "");
  for (const ext of [".png", ".jpg", ".jpeg"]) if (fs.existsSync(path.join(PUBLIC, base + ext))) return base + ext;
  return null;
}

const files = SOURCES.flatMap((d) => filesIn(path.join(ROOT, d)));
const urls = new Set(files.flatMap((f) => fs.readFileSync(f, "utf8").match(REF) ?? []));

let before = 0, after = 0;
const renamed = new Map();
for (const url of [...urls].sort()) {
  const src = sourceOf(url);
  if (!src) {
    console.warn(`  missing source for ${url}`);
    continue;
  }
  const out = src.replace(/\.(png|jpe?g)$/, ".webp");
  const input = sharp(path.join(PUBLIC, src));
  const { width, height, hasAlpha } = await input.metadata();
  const limit = maxSize(url);
  const resized = limit && Math.max(width, height) > limit ? input.resize({ width: width >= height ? limit : undefined, height: height > width ? limit : undefined }) : input;
  await resized
    .webp(hasAlpha ? { quality: 82, alphaQuality: 90, effort: 6 } : { quality: 80, effort: 6 })
    .toFile(path.join(PUBLIC, out));
  before += fs.statSync(path.join(PUBLIC, src)).size;
  after += fs.statSync(path.join(PUBLIC, out)).size;
  if (url !== out) renamed.set(url, out);
}

// Point the code and data at the .webp files.
let edits = 0;
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const next = text.replace(REF, (m) => renamed.get(m) ?? m);
  if (next !== text) {
    fs.writeFileSync(f, next);
    edits++;
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(1) + "MB";
console.log(`${urls.size} images: ${mb(before)} -> ${mb(after)} as WebP; updated ${edits} files`);
