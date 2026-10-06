// Draws every ingredient bin the way the kitchen does: a 72px window, the icon scaled 1.3x and clipped (3x zoom).
import sharp from "sharp"; import fs from "node:fs";
const ing = JSON.parse(fs.readFileSync("data/ingredients.json", "utf8"));
const Z = 3, WIN = 72 * Z, ICON = Math.round(72 * 1.3 * Z), off = Math.round((ICON - WIN) / 2);
const out = process.argv[2], kitchens = process.argv.slice(3);
const items = ing.filter((i) => kitchens.includes(i.kitchen) || (!i.kitchen && kitchens.length === 0));
const tiles = [];
for (const [n, i] of items.entries()) {
  const url = i.icon.match(/url\('([^']+)'\)/)?.[1];
  if (!url || !url.endsWith(".png") || url.includes("/sushi/")) continue;
  const icon = await sharp("public" + url).resize(ICON, ICON, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const bin = await sharp({ create: { width: WIN, height: WIN, channels: 4, background: i.action ? "#3b2a1e" : "#f8f0e3" } })
    .composite([{ input: await sharp(icon).extract({ left: off, top: off, width: WIN, height: WIN }).toBuffer() }]).png().toBuffer();
  tiles.push({ bin, name: i.name });
}
const cols = 8, cell = WIN + 24, rows = Math.ceil(tiles.length / cols);
await sharp({ create: { width: cols * cell, height: rows * (cell + 20), channels: 4, background: "#2a2522" } })
  .composite(tiles.flatMap((t, k) => [
    { input: t.bin, left: (k % cols) * cell + 12, top: Math.floor(k / cols) * (cell + 20) + 12 },
    { input: Buffer.from(`<svg width="${cell}" height="20"><text x="${cell / 2}" y="14" fill="#fff" font-size="13" font-family="Arial" text-anchor="middle">${t.name}</text></svg>`), left: (k % cols) * cell, top: Math.floor(k / cols) * (cell + 20) + cell + 2 },
  ])).png().toFile(out);
console.log(tiles.length, "bins");
