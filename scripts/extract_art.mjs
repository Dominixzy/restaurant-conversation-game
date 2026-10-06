// Cuts the generated sprite and background sheets in art/generated/<kitchen>/ into the game's image files.
//
// Each sprite is cleaned (near-invisible pixels and stray specks removed), trimmed, then fitted into the
// spot its mockup used on the 512x512 canvas (art/mockup-refs/<kitchen>/<name>.png), so plate layers still
// stack where the game expects. Icons are centred at 86% of the canvas. The background sheet holds the
// counter (top half) and the dining room (bottom half).
//
// Run:  node scripts/extract_art.mjs            (writes PNG/JPG next to the mockup SVGs in public/assets/food/)
// Then point data/*.json at the new files (see `--paths` to print the replacements).

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "public/assets/food");
const GEN = path.join(ROOT, "art/generated");
const REFS = path.join(ROOT, "art/mockup-refs");

const ALPHA_MIN = 24; // pixels fainter than this are noise from background removal
const SIZE = 512;

// The café sheet has no manifest: 4x4, row-major, as listed in its README.
const CAFE_CELLS = [
  "batter", "pancake", "butter", "syrup",
  "strawberries", "blueberries", "berries", "macaron-pink",
  "macaron-yellow", "macaron-green", "final-pancakes-strawberry", "final-pancakes-blueberry",
  "final-macaron-tower", "plate", "mat", "icons/pan",
];
const CAFE_ICONS = { batter: "batter", berries: "berries", blueberries: "blueberries", butter: "butter", "macaron-pink": "macaron-pink", "macaron-green": "macaron-green", "macaron-yellow": "macaron-yellow", strawberries: "strawberries", syrup: "syrup" };

// How each sprite sits in its mockup's spot (centred on it):
//   fill   stretches it to the spot exactly (the pizza, plates and mats, which must line up perfectly)
//   width  matches the spot's width (stacked layers: the mockups drew them as thin side views)
//   box    fits it inside [w, h] pixels instead (piles and small ingredients the mockup drew tiny or spread out)
const FIT = {
  italian: {
    dough: { fill: true }, "pizza-sauced": { fill: true }, "pizza-margherita": { fill: true }, "pizza-margherita-cut": { fill: true },
    "pizza-funghi": { fill: true }, "pizza-funghi-cut": { fill: true }, board: { fill: true }, cloth: { fill: true },
    "dough-ball": { box: [230, 190] }, "sauce-puddle": { box: [220, 150] }, mozzarella: { box: [210, 150] }, mushroom: { box: [210, 150] },
    basil: { box: [150, 120] }, parmesan: { box: [170, 120] }, "spaghetti-dry": { box: [300, 160] },
  },
  thai: {
    mat: { fill: true },
    garlic: { box: [190, 150] }, chili: { box: [190, 150] }, "chili-2": { box: [210, 160] }, "chili-3": { box: [230, 170] },
    "paste-1": { box: [240, 160] }, "paste-2": { box: [240, 160] }, "paste-3": { box: [240, 160] },
    "cherry-tomato": { box: [210, 160] }, "dried-shrimp": { box: [200, 150] }, "salted-crab": { box: [210, 160] }, peanuts: { box: [190, 150] },
    "palm-sugar": { box: [150, 120] }, "fish-sauce": { box: [150, 110] }, lime: { box: [180, 140] }, papaya: { box: [300, 210] },
    "som-tam-poo": { box: [340, 240] }, "som-tam-thai": { box: [340, 240] }, "som-tam-thai-no-peanuts": { box: [340, 240] },
  },
  cafe: {
    plate: { fill: true }, mat: { fill: true },
    batter: { width: true }, pancake: { width: true }, "macaron-pink": { width: true }, "macaron-green": { width: true }, "macaron-yellow": { width: true },
    butter: { box: [120, 100] }, syrup: { box: [260, 130] }, strawberries: { box: [210, 130] }, blueberries: { box: [200, 120] }, berries: { box: [170, 150] },
  },
  diner: {
    plate: { fill: true }, mat: { fill: true },
    "bun-bottom": { width: true }, "bun-top": { width: true }, "patty-raw": { width: true }, "patty-seasoned": { width: true }, patty: { width: true },
    cheese: { width: true }, lettuce: { width: true }, tomato: { width: true }, potato: { box: [260, 200] }, "potato-peeled": { box: [260, 200] },
    salt: { box: [230, 120] },
  },
};
// Kept as mockups: the Thai "plate" is the clay mortar everything is pounded in; the generated one is a saucer.
const SKIP = { thai: ["plate.png"] };
// Better source cells for some icons: the "Beef Patty" bin holds raw meat.
const ICON_FROM = { diner: { "icons/patty.png": "patty-raw.png" } };

function cellsFor(kitchen) {
  if (kitchen === "cafe") {
    const assets = {};
    CAFE_CELLS.forEach((name, i) => (assets[`${name}.png`] = { row: Math.floor(i / 4), column: i % 4 }));
    for (const [icon, food] of Object.entries(CAFE_ICONS)) assets[`icons/${icon}.png`] = assets[`${food}.png`];
    return { columns: 4, rows: 4, assets };
  }
  const m = JSON.parse(fs.readFileSync(path.join(GEN, kitchen, "manifest.json"), "utf8"));
  for (const [icon, food] of Object.entries(ICON_FROM[kitchen] ?? {})) m.assets[icon] = m.assets[food];
  return { columns: m.columns, rows: m.rows, assets: m.assets };
}

// Connected components of visible pixels (4-neighbour flood fill).
function components(alpha, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const comps = [];
  const stack = [];
  for (let start = 0; start < w * h; start++) {
    if (alpha[start] < ALPHA_MIN || label[start] !== -1) continue;
    const c = { id: comps.length, n: 0, x0: w, y0: h, x1: 0, y1: 0, sx: 0, sy: 0 };
    label[start] = c.id;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p / w) | 0;
      c.n++; c.sx += x; c.sy += y;
      if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || label[q] !== -1 || alpha[q] < ALPHA_MIN) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
        label[q] = c.id;
        stack.push(q);
      }
    }
    comps.push(c);
  }
  return { label, comps };
}

// Bounding box of the mockup's drawing (anything not white/transparent), in 512 canvas pixels.
async function mockupBox(kitchen, name) {
  const file = path.join(REFS, kitchen, name);
  if (!fs.existsSync(file)) return null;
  const { data, info } = await sharp(file).resize(SIZE, SIZE, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = SIZE, y0 = SIZE, x1 = -1, y1 = -1;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const ink = data[i + 3] > 20 && (data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235);
      if (ink) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

async function sprites(kitchen) {
  const sheet = path.join(GEN, kitchen, "sprites-v1.png");
  const { data, info } = await sharp(sheet).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const { columns, rows, assets } = cellsFor(kitchen);
  const cw = W / columns, ch = H / rows;
  // Cell edges sit in the emptiest line near where the grid says they should be (items don't always respect it).
  const gutter = (expected, count, along) => {
    let best = Math.round(expected), bestInk = Infinity;
    for (let at = Math.round(expected - 30); at <= Math.round(expected + 30); at++) {
      let ink = 0;
      for (let i = along[0]; i < along[1]; i++) ink += along[2] ? data[(at * W + i) * 4 + 3] : data[(i * W + at) * 4 + 3];
      if (ink < bestInk) { bestInk = ink; best = at; }
    }
    return best;
  };
  const rowEdges = [0, ...Array.from({ length: rows - 1 }, (_, r) => gutter((r + 1) * ch, 0, [0, W, true])), H];
  const colEdges = rowEdges.slice(0, -1).map((top, r) => [0, ...Array.from({ length: columns - 1 }, (_, c) => gutter((c + 1) * cw, 0, [top, rowEdges[r + 1], false])), W]);
  const written = [];

  for (const [name, { row, column }] of Object.entries(assets)) {
    if (SKIP[kitchen]?.includes(name)) continue;
    // Blobs are found inside the cell first, since neighbouring items sometimes touch (the pizzas).
    // The item is the biggest blob centred in the cell, plus any nearby crumbs (salt, cheese shreds).
    const cx0 = colEdges[row][column], cy0 = rowEdges[row];
    const cW = colEdges[row][column + 1] - cx0, cH = rowEdges[row + 1] - cy0;
    const pick = (rx0, ry0, rW, rH) => {
      const alpha = new Uint8Array(rW * rH);
      for (let y = 0; y < rH; y++) for (let x = 0; x < rW; x++) alpha[y * rW + x] = data[((ry0 + y) * W + rx0 + x) * 4 + 3];
      const { label, comps } = components(alpha, rW, rH);
      const inside = (c) => {
        const mx = rx0 + c.sx / c.n, my = ry0 + c.sy / c.n;
        return mx >= cx0 && mx < cx0 + cW && my >= cy0 && my < cy0 + cH;
      };
      const candidates = comps.filter(inside);
      if (!candidates.length) return null;
      const main = candidates.reduce((a, b) => (b.n > a.n ? b : a));
      const pad = Math.min(cw, ch) * 0.06;
      // Bits touching the region's edge belong to the neighbouring item.
      const atEdge = (c) => c.x0 <= 1 || c.y0 <= 1 || c.x1 >= rW - 2 || c.y1 >= rH - 2;
      const keep = candidates.filter((c) => c === main || (c.n >= 12 && !atEdge(c) && c.x1 >= main.x0 - pad && c.x0 <= main.x1 + pad && c.y1 >= main.y0 - pad && c.y0 <= main.y1 + pad));
      return { label, keep, main, rx0, ry0, rW, clipped: atEdge(main) };
    };
    let sel = pick(cx0, cy0, cW, cH);
    if (!sel) throw new Error(`${kitchen}: nothing found in the cell for ${name} (row ${row}, column ${column})`);
    // An item that reaches past its cell (berries poking up over the tower) would be cut flat: look a bit
    // further out, and keep the bigger shape if it ends there. If it runs on, it has merged into a
    // neighbour (touching pizzas), so the cut inside the cell stays.
    if (sel.clipped) {
      const M = 80;
      const gx0 = Math.max(0, cx0 - M), gy0 = Math.max(0, cy0 - M);
      const grown = pick(gx0, gy0, Math.min(W, cx0 + cW + M) - gx0, Math.min(H, cy0 + cH + M) - gy0);
      if (grown && !grown.clipped && grown.main.n >= sel.main.n) {
        sel = grown;
        console.log(`  ${kitchen}/${name}: extended past its cell`);
      } else console.log(`  ${kitchen}/${name}: touches its cell edge (kept the cell cut)`);
    }
    const { label, keep, rx0, ry0, rW } = sel;
    const ids = new Set(keep.map((c) => c.id));
    const x0 = Math.min(...keep.map((c) => c.x0)), y0 = Math.min(...keep.map((c) => c.y0));
    const x1 = Math.max(...keep.map((c) => c.x1)), y1 = Math.max(...keep.map((c) => c.y1));
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const crop = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!ids.has(label[(y0 + y) * rW + (x0 + x)])) continue;
        const s = (ry0 + y0 + y) * W + (rx0 + x0 + x);
        data.copy(crop, (y * w + x) * 4, s * 4, s * 4 + 4);
      }

    // Where it goes on the 512 canvas.
    const icon = name.startsWith("icons/");
    const fit = FIT[kitchen]?.[name.replace(".png", "")] ?? {};
    const box = icon ? null : await mockupBox(kitchen, name);
    const target = box
      ? { cx: (box.x0 + box.x1) / 2, cy: (box.y0 + box.y1) / 2, bw: box.x1 - box.x0 + 1, bh: box.y1 - box.y0 + 1 }
      : { cx: SIZE / 2, cy: SIZE / 2, bw: SIZE * 0.86, bh: SIZE * 0.86 };
    if (fit.box) [target.bw, target.bh] = fit.box;
    let tw, th;
    if (fit.fill) { tw = target.bw; th = target.bh; }
    else if (fit.width) { tw = target.bw; th = (h * target.bw) / w; }
    else { const k = Math.min(target.bw / w, target.bh / h); tw = w * k; th = h * k; }
    tw = Math.max(1, Math.round(tw)); th = Math.max(1, Math.round(th));
    const piece = await sharp(crop, { raw: { width: w, height: h, channels: 4 } }).resize(tw, th, { fit: "fill", kernel: "lanczos3" }).png().toBuffer();
    const left = Math.round(target.cx - tw / 2), top = Math.round(target.cy - th / 2);
    const out = path.join(OUT, kitchen, name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: piece, left: Math.max(0, left), top: Math.max(0, top) }])
      .png({ compressionLevel: 9 })
      .toFile(out);
    written.push(`${kitchen}/${name}`);
  }
  return written;
}

// The counter props (macarons, papayas, rolling pin, grill tray) are drawn much bigger than the food on
// the plate, so only the plain surface above them is kept: `height` pixels from the top of the panel.
// Short ones are mirrored downwards so they stay sharp on a tall phone screen; that only works for
// straight planks (the café's curvy grain would show the fold).
const COUNTER_PLAIN = { italian: { height: 365, mirror: true }, thai: { height: 350, mirror: true }, cafe: { height: 525 }, diner: { height: 465, mirror: true } };

// Top half: the prep counter; bottom half: the dining room. A thin seam is trimmed between them.
async function backgrounds(kitchen) {
  const sheet = path.join(GEN, kitchen, "backgrounds-v1.png");
  const { width, height } = await sharp(sheet).metadata();
  const half = Math.floor(height / 2);
  const seam = 3;
  const { height: plainHeight = half - seam, mirror = false } = COUNTER_PLAIN[kitchen] ?? {};
  const plain = Math.min(plainHeight, half - seam);
  const top = await sharp(sheet).extract({ left: 0, top: 0, width, height: plain }).toBuffer();
  const layers = [{ input: top, left: 0, top: 0 }];
  if (mirror) layers.push({ input: await sharp(top).flip().toBuffer(), left: 0, top: plain });
  await sharp({ create: { width, height: plain * (mirror ? 2 : 1), channels: 3, background: "#000" } })
    .composite(layers)
    .jpeg({ quality: 86 })
    .toFile(path.join(OUT, kitchen, "counter.jpg"));
  await sharp(sheet).extract({ left: 0, top: half + seam, width, height: height - half - seam }).jpeg({ quality: 86 }).toFile(path.join(OUT, kitchen, "dining.jpg"));
  return [`${kitchen}/counter.jpg`, `${kitchen}/dining.jpg`];
}

const all = [];
for (const kitchen of ["italian", "thai", "cafe", "diner"]) {
  all.push(...(await sprites(kitchen)), ...(await backgrounds(kitchen)));
}
if (process.argv.includes("--paths")) for (const f of all) console.log(`/assets/food/${f.replace(/\.(png|jpg)$/, ".svg")} -> /assets/food/${f}`);
console.log(`wrote ${all.length} files`);
