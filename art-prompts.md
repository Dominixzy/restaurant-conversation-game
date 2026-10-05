# Sushi Art Prompts (sheet 9.png and up)

How to use: generate **one item per image**. Every time, attach `public/assets/food/sushi/1.png` as the style reference.
Join the **item prompt + STYLE + AVOID**. Once all items are ready, pack them into a 4x4 sheet (or send the separate files and Claude will pack them).

Suggested file names: `art/9-01-rice-on-nori.png` … `art/9-16-shiso.png`

---

## STYLE (append to every prompt)

```
STYLE: semi-realistic hand-painted mobile game food illustration, matching the attached reference sheet exactly (same rendering, line weight, saturation and lighting). 3/4 top-down view, camera about 45 degrees above the item. Soft warm key light from the top-left, gentle specular highlights, subtle ambient occlusion inside the shape only. Thin dark-brown outline (#4A2A14, about 3px at 512px) around the outer silhouette. Single item, centered, occupying about 80% of a square 512x512 canvas with even padding on all sides. Fully transparent background (PNG with alpha channel).
```

## AVOID (append to every prompt)

```
AVOID: plate, board, table, tablecloth, background color, cast shadow on the ground, outer glow, halo, colored fringe around edges, text, watermark, chopsticks, hands, multiple copies, cropped edges, photorealistic photo look, flat vector look.
```

**Scale reference:** the nigiri rice ball in the reference sheet = **1.0 unit**. Every prompt below states size in this unit, so items keep the same scale when stacked on the plate.

---

## Priority 1: Assembly steps

### 1. Rice spread on nori (base for an open roll)
```
A rectangular sheet of roasted nori seaweed lying flat, landscape orientation, about 1.7 units wide. An even layer of glossy white sushi rice is pressed over the sheet, with individual plump grains visible, leaving a clean bare strip of dark-green textured nori (about 15% of the depth) along the far edge. Rice edges slightly irregular, a few grains sticking out. The sheet reads clearly as a flat rectangle seen at an angle.
```

### 2a. Uncut roll: salmon
```
One long cylindrical hosomaki roll, uncut, lying horizontally, about 1.9 units long and 0.5 units thick. Tightly wrapped in dark-green roasted nori with subtle seaweed texture and a soft sheen. The near-right end is a clean cut face showing a white rice ring with an orange salmon center. A few rice grains visible at the ends.
```

### 2b. Uncut roll: avocado and cucumber
```
Same as 2a, but the cut end face shows a white rice ring with a pale-green avocado strip and two bright-green cucumber sticks in the center.
```

### 3a. Cut roll slices: salmon
```
Six pieces of salmon hosomaki cut from one roll, arranged in a slightly curved row and gently fanned so each cut face is tilted toward the viewer. Each piece is about 0.45 units wide: a dark-green nori outer ring, white rice ring and an orange salmon center. Clean knife cuts, consistent piece size, tiny rice grain detail.
```

### 3b. Cut roll slices: avocado and cucumber
```
Same as 3a, but each cut face shows a pale-green avocado wedge and bright-green cucumber squares in the center, matching the finished avocado-cucumber roll in the reference sheet.
```

### 4. Finished Ikura Gunkan
```
One finished ikura gunkan-maki sushi, about 1.0 unit wide: an oval of white sushi rice wrapped by a tall band of dark-green nori, with a mound of glossy translucent orange salmon roe (ikura) piled above the rim. Each roe bead has a bright specular highlight and a darker core. Framing, size and angle exactly match the finished nigiri and rolls in the bottom row of the reference sheet.
```

### 5. Salmon slice draped over rice
```
A single slice of fresh raw salmon, about 1.15 units long, arched and draped as if laid over an invisible nigiri rice ball: the center is raised, both ends curve down, and the hollow underside is empty so a rice ball can show through underneath. Vivid orange flesh with diagonal white fat lines following the curve, moist sheen along the top.
```

### 6. Tuna slice draped over rice
```
Same shape and size as item 5, but a slice of raw maguro tuna: deep ruby red, smooth dense texture, faint lighter grain lines, moist sheen.
```

---

## Priority 2: Items mentioned in the dialogue

### 7. Miso soup
```
A small round Japanese lacquer soup bowl, black outside and red inside, about 0.9 units wide, filled with cloudy golden-beige miso soup. Floating on top: three small white tofu cubes, a few dark-green wakame pieces and a sprinkle of thin green-onion rings. No lid, no spoon. A faint wisp of steam is allowed, but keep it subtle and opaque enough to read on a transparent background.
```

### 8. Small salad
```
A small round white ceramic bowl, about 0.8 units wide, holding a fresh Japanese side salad: finely shredded green cabbage, thin cucumber slices, one halved cherry tomato and a light drizzle of creamy sesame dressing with a few white sesame seeds.
```

### 9. Green tea cup (yunomi)
```
A tall cylindrical Japanese yunomi tea cup with no handle, about 0.55 units wide, glazed in soft celadon green with a subtle crackle pattern and a slightly uneven hand-made rim, filled almost to the top with clear yellow-green tea.
```

### 10. Glass of cold water
```
A short clear drinking glass, about 0.55 units wide, filled with water and three ice cubes. Because the background is transparent, render the glass with a light blue-grey tint, bright white rim and edge highlights, and slightly opaque ice cubes so the shape stays clearly visible on any background.
```

---

## Priority 3: Ingredients for new menus

### 11. Cooked shrimp (ebi)
```
One butterflied cooked shrimp for nigiri, about 1.1 units long, opened flat and slightly arched to drape over rice: white flesh with bright orange-red stripes across the top, red tail fan left on at one end, smooth glossy surface.
```

### 12. Japanese omelette (tamago)
```
A rectangular block of Japanese sweet rolled omelette (tamagoyaki), about 1.0 unit long, bright yellow, with thin visible folded layers on the cut side, lightly golden-browned top surface and soft rounded edges.
```

### 13. Crab sticks (kani)
```
Three imitation crab sticks lying side by side, each about 0.9 units long: white bodies with bright red-orange coloring along the top, fine fibrous texture, one stick slightly pulled apart at the end to show shreds.
```

### 14a. Toasted white sesame seeds
```
A small neat heap of toasted white sesame seeds, about 0.4 units wide, individual teardrop-shaped seeds in cream to light-golden tones.
```

### 14b. Flying fish roe (tobiko)
```
A small heap of tobiko flying-fish roe, about 0.4 units wide, made of tiny bright orange beads clearly smaller and crunchier-looking than ikura, with many small specular highlights.
```

### Finished dishes for the new menus (match the bottom row of the reference sheet)
```
F1. One finished ebi nigiri: butterflied cooked shrimp (orange-red stripes, red tail) draped over an oval of white sushi rice, about 1.0 unit wide.
F2. One finished tamago nigiri: a yellow tamagoyaki block on an oval of white rice, held by a thin band of dark-green nori around the middle.
F3. One piece of California roll, inside-out (rice on the outside) coated with orange tobiko, cut face showing a red-white crab stick, avocado and cucumber wrapped in nori.
```

---

## Priority 4: Feedback and presentation

### 15. Failed dish (for the "OH NO!" screen)
```
A comically failed nigiri, about 1.1 units wide: the rice ball is squashed and crumbling with loose grains scattered around it, the salmon slice has slid off sideways and is folded over itself, and a messy smear of wasabi sits on the side. Clumsy and funny, still appetizing and cartoon-friendly, never gross.
```

### 16. Shiso leaf (garnish under the food)
```
A single fresh green shiso (perilla) leaf lying flat, about 1.3 units long, broad heart-shaped leaf with serrated edges, visible central and side veins, slight natural curl at the tip, vivid fresh green.
```

---

## Proposed layout for `9.png` (4x4, column-row)

| | col 0 | col 1 | col 2 | col 3 |
|---|---|---|---|---|
| row 0 | 1 rice on nori | 2a uncut roll (salmon) | 2b uncut roll (veg) | 4 Ikura Gunkan final |
| row 1 | 3a cut roll (salmon) | 3b cut roll (veg) | 5 draped salmon | 6 draped tuna |
| row 2 | 7 miso soup | 8 salad | 9 green tea | 10 water |
| row 3 | 11 ebi | 12 tamago | 15 failed dish | 16 shiso |

Items 13, 14a, 14b and F1–F3 go on the next sheet (`10.png`).

---

## Short version (one line per item, same format as the original prompt set)

Prefix every line with `[STYLE]` = `2D game asset, semi-realistic hand-painted food illustration matching the attached reference sheet, 3/4 top-down view, soft light from top-left, thin dark-brown outline, single item centered, transparent background, no plate, no shadow, no glow`

1. Assembly steps
* Rice spread on nori: `[STYLE], rectangular nori sheet covered with an even layer of white sushi rice, bare strip of nori along the top edge, 1.7x nigiri rice size`
* Uncut roll (salmon): `[STYLE], long uncut maki roll wrapped in dark green nori, lying horizontally, cut end shows white rice ring with orange salmon center`
* Uncut roll (avocado-cucumber): `[STYLE], long uncut maki roll wrapped in dark green nori, cut end shows rice ring with avocado and cucumber center`
* Cut roll slices (salmon): `[STYLE], six salmon maki pieces in a slightly fanned row, cut faces toward viewer`
* Cut roll slices (avocado-cucumber): `[STYLE], six avocado-cucumber maki pieces in a slightly fanned row, cut faces toward viewer`
* Finished Ikura Gunkan: `[STYLE], finished ikura gunkan sushi, oval rice wrapped in tall nori band, topped with glossy orange salmon roe`
* Salmon slice draped over rice: `[STYLE], raw salmon slice arched as if draped over a rice ball, hollow underside, white fat lines`
* Tuna slice draped over rice: `[STYLE], raw tuna slice arched as if draped over a rice ball, hollow underside, deep ruby red`

2. Items mentioned in the dialogue
* Miso soup: `[STYLE], black-and-red lacquer bowl of miso soup with tofu cubes, wakame and green onion`
* Small salad: `[STYLE], small white bowl of shredded cabbage, cucumber and cherry tomato with sesame dressing`
* Green tea: `[STYLE], handleless celadon yunomi cup filled with green tea`
* Cold water: `[STYLE], short glass of water with ice cubes, light blue tint and bright white edge highlights so it reads on transparent background`

3. New ingredients
* Shrimp (ebi): `[STYLE], butterflied cooked shrimp with orange-red stripes and red tail, slightly arched for nigiri`
* Tamago: `[STYLE], rectangular block of yellow Japanese rolled omelette with visible layers`
* Crab stick (kani): `[STYLE], three imitation crab sticks, white with red-orange top`
* Sesame: `[STYLE], small heap of toasted white sesame seeds`
* Tobiko: `[STYLE], small heap of tiny bright orange tobiko roe, smaller beads than ikura`
* Finished new dishes: `[STYLE], one finished ebi nigiri` / `[STYLE], one finished tamago nigiri with nori belt` / `[STYLE], one piece of inside-out California roll coated in tobiko`

4. Extras
* Failed dish: `[STYLE], comically failed nigiri, squashed rice with scattered grains, fish slid off sideways, cartoon-friendly not gross`
* Shiso leaf: `[STYLE], single flat green shiso leaf with serrated edges, 1.3x nigiri rice size`
