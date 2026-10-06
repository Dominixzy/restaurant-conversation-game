# Restaurant Conversation Game — Project Overview

A browser game for practicing **English restaurant conversation**. The player is a chef who greets a customer, picks polite (or rude) replies in a visual-novel style dialogue, then picks the steps to make the ordered dish while the kitchen animates each one. Politeness raises the customer's mood, and mood decides the star rating.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js **16.3.5** (App Router). Per `AGENTS.md`, read `node_modules/next/dist/docs/` before changing Next-specific code, since this version has breaking changes |
| UI | React 19.2, Tailwind CSS v4 (`@import "tailwindcss"` + `@theme` in `app/globals.css`) |
| Animation | framer-motion |
| Icons | lucide-react |
| State | zustand (one store persisted to `localStorage`, one in-memory gameplay store) |
| Fonts | Google: Inter, Playfair Display, Luckiest Guy. Local: Roasted Ketchup, Avermont House (**personal-use-only license**, see `public/fonts/`) |
| Tooling script | `remove_bg.js` uses `@imgly/background-removal-node` to turn `avatar*.jpg` into transparent `avatar*.png` |

There is no backend, API route, database or test suite. Everything runs client-side, and all content is static JSON.

## Running

```bash
npm install      # required first; "next: command not found" means this was skipped
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint
node remove_bg.js   # optional: regenerate transparent avatar PNGs
```

## Directory layout

```
app/
  layout.tsx          Root layout, font variables, metadata
  globals.css         Tailwind v4 import, font theme tokens
  page.tsx            Title screen ("Tap anywhere to start" → /profile)
  profile/page.tsx    Chef ID card: enter name, tap photo to cycle avatar, "APPROVED" stamp → /select
  select/page.tsx     Level select grid: 5 restaurants, lock state, difficulty, best stars
  play/[id]/page.tsx  Main game: dialogue → cooking → result phases
  play/[id]/DialogueScene.tsx  Immersive conversation screen (see below)
  play/[id]/Dish.tsx  Plate stacking + finished-dish picture
lib/
  store.ts            useGameStore (persisted as "restaurant-game-storage"): profile + per-level progress
  gameplayStore.ts    useGameplayStore (not persisted): phase, dialogue node, mood, recipe, plate contents
data/
  restaurants.json    Level metadata (id, name, cuisine, difficulty, cover image, theme colors)
  dialogues.json      Dialogue trees keyed by restaurant id → node id
  recipes.json        Recipe id → target dish name + correct ingredient order
  ingredients.json    Ingredients (sprite cell + plate layout) and the Roll / Cut tool steps
  assembly.json       How layers combine on the plate: merged images, Roll and Cut results
public/
  assets/             Backgrounds, avatars, customer photos, food covers, sushi sprite sheets (sushi/1–8.png)
  fonts/              Local fonts + license files
images_sushi/         Source AI-generated sprite images (not referenced by code)
0905.mov, Presentation_Script.docx   Demo video and presentation script
```

## Screen flow

```
/  (title) ──tap──▶ /profile ──ENTER KITCHEN──▶ /select ──unlocked card──▶ /play/[id]
                                                    ▲                            │
                                                    └──────── CONTINUE ──────────┘
```

## Gameplay model

### Persistent progress (`lib/store.ts`)
- `profile`: `{ name, avatar: { face, hair, outfit } }`. Only `face` is used (it holds an avatar image path).
- `progress[rId]`: `{ unlocked, score, stars }`. `r1` starts unlocked.
- `completeLevel(id, stars)` keeps the best star count and unlocks the next level (r1→r2→…→r5). The chain is hard-coded. It is only called when stars > 0.

### Round state (`lib/gameplayStore.ts`)
A level serves its customers one at a time: `dialogue` → `cooking` → `serving` (that guest's stars) → next guest … → `result` (every ticket plus the level's stars, the rounded average). Each guest starts with mood 50. `restaurants.json` lists `customers` (r1: Daniel, Emma, Mrs. Sato), each with its own `dialogue` tree id in `dialogues.json`; levels that still have a single `customer` use the restaurant id as the tree.

1. **Dialogue:** start at node `start`. Each choice has `next` and `moodChange`. Mood starts at 50 and changes by `moodChange × 25`, clamped to 0–100. A node whose choice list is empty and has `action: "start_cooking"` + `recipeId` shows a "Go to Kitchen" button.
2. **Cooking:** the screen is split like a sushi bar: the dining room across the counter on top (the customer sits behind the counter edge and reacts to each step with a short English line and a face), and the top-down prep counter below (you are the chef, so no chef sprite is shown). The order ticket lists `recipe.correctSequence` and marks each slot green (right), red (wrong) or empty, plus any extra items in red. Clicking ingredient bins stacks them on the plate (`assembledIngredients`). Tool steps (Knead, Stretch, Roll, Boil, Bake, Grill, Cut…) sit in the same sequence. There are no mini-games: when a tool step or an ingredient with prep work is picked, the kitchen does it by itself as a short animation in a small card beside the plate (`app/play/[id]/StepAnimation.tsx`, about 1–3 s, tap the card to skip; other bins wait until it finishes), then the result goes on the plate. Animations are configured in `assembly.json`: `actions.<id>.anim` for steps, `prep.<id>.anim` for ingredients, and `anims` to pick a different one by what is on top of the plate. The nine kinds, drawn on a 100×75-unit stage from a single progress value:
   - **cook** (Boil, Bake, Flip, Grill, Fry): the food sits in a pot / oven / pan / grill / fryer and goes from pale/raw to cooked with steam; `sides: 2` flips it halfway. Its `hint` ("Juicy and brown!") pops up at the end.
   - **swipe** (Cut, slice fish/avocado/cucumber/tomato): the knife runs along each cut line in turn.
   - **spread** (rice on nori, sauce on dough, peel potato, season patty, parmesan, salt): the ingredient's tool zig-zags over the area, revealing the sauce/rice/seasoning behind it.
   - **scatter** (mozzarella, mushrooms, basil, berries): pieces drop onto their spots one by one.
   - **measure** (wasabi, roe, sauces, fish sauce, lime, palm sugar, batter, syrup): the bottle or spoon tips and pours; `look: "press"` shows hands shaping the rice instead.
   - **stir** (Knead, Toss pasta, Mix som tam, wrap the gunkan nori): a spoon or hand goes round the food.
   - **roll**: the bamboo mat rolls the sheet into a roll. **stretch**: a rolling pin spreads the dough out. **pound**: the pestle crushes each chunk in the mortar.

   Each finishes with a short label (`done`, e.g. "Golden!"). A step that wouldn't change the food skips its animation. The name of each added item floats up over the plate. Undo removes the last step, Trash clears the plate. When the plate matches the recipe it is served as `recipe.final` (2 nigiri, 2 gunkan or 6 roll pieces) by `app/play/[id]/Dish.tsx`, and the result card shows the same dish.
3. **Result (`handleServe` → `serveFood`):** the plate must match `correctSequence` exactly (order and count). A correct dish gives 3★ if mood ≥ `MOOD_HAPPY` (75), 2★ if ≥ `MOOD_OK` (40), otherwise 1★. A wrong dish gives 0★ ("OH NO!"). The same two constants drive the customer's face and mood-bar colours.

### Data formats

```jsonc
// dialogues.json
{ "r1": { "start": {
    "text": "Customer line",
    "customerImage": "/path.jpg" | "bg-[url('/sprite.png')] bg-[length:X_Y] bg-[position:X_Y]",
    "choices": [ { "text": "Player reply", "next": "nodeId", "moodChange": 1,
                   "tip": "Grade 10 language tip shown after the player picks this reply" } ],
    "vocab": [ { "word": "familiar with", "meaning": "..." } ],   // must appear in "text"; becomes tappable
    "action": "start_cooking", "recipeId": "salmon_nigiri"   // terminal nodes only
} } }

// restaurants.json (per level)
{ "customers": [ { "name": "Daniel", "spriteColumn": 2, "gender": "male", "dialogue": "r1" }, … ] }   // column in sushi/4.png: 0 chef, 1 woman, 2 man, 3 grandma; gender picks the voice

// recipes.json  (final = how the finished dish is served: a sprite cell or an image, and how many pieces)
{ "salmon_nigiri": { "targetDishName": "Salmon Nigiri", "correctSequence": ["rice","wasabi","salmon"], "final": { "sprite": [0,3], "count": 2 } },
  "veggie_roll": { "correctSequence": ["nori_flat","rice_sheet","avocado","cucumber","roll","cut"], "final": { "sprite": [2,3], "count": 6 } } }

// assembly.json
// merges: two layers on top of each other become one picture (nori + rice sheet -> rice_on_nori, rice + nori_wrap -> gunkan_rice, + ikura -> gunkan_ikura)
// actions: a step with a "base" turns the base and what's on it into one dish, chosen by the first listed filling present
//          (roll: rice_on_nori -> roll_salmon / roll_veg; bake: pizza_sauced -> pizza_margherita / pizza_funghi, with an oven glow);
//          knead: dough -> dough_kneaded; stretch: dough_kneaded -> dough_flat; boil: spaghetti (dry) -> pasta_cooked;
//          toss_pasta: pasta_sauced -> pasta_tossed; season: patty_raw -> patty_seasoned; grill: (seasoned) patty -> patty;
//          peel: potato -> potato_peeled; cut: potato_peeled -> potato_sticks; fry: potato_sticks -> fries;
//          som tam: chili + chili merge into chili_2 / chili_3; pound: garlic + chilies -> paste_1..3 (redder with more chilies);
//          toss (Mix): any paste + toppings -> som_tam_poo / som_tam_thai / som_tam_thai_no_peanuts ("base" may list several ids)
//          a step with a "map" turns the top layer into its result (cut: rolls -> 6 pieces, pizzas -> sliced, with a knife chop)

// restaurants.json: "kitchen" picks the ingredient set, "scene" the pictures
{ "kitchen": "italian", "scene": { "dining": "…/dining.svg", "counter": "…/counter.svg", "mat": { "image", "size", "position" }, "plate": { … } } }

// ingredients.json
[ { "id": "rice", "name": "Sushi Rice", "icon": "<tailwind sprite classes for the bin>",
    "sprite": [0,0],                       // [col,row] in sushi/1.png (4x4)
    "plate": { "size": 36, "x": 0, "y": 4, "lift": 5 } } ]
// plate values are % of the plate area. Layers stack in the order they're added (last on top) and each
// rises by the "lift" of the layers below. "base": true wraps around earlier layers (gunkan nori);
// "side": true places a garnish beside the dish (ginger, soy sauce).
```

Sprites are cut from sheets with Tailwind arbitrary `bg-[length:…] bg-[position:…]` classes. When `customerImage` uses the `bg-` form, `play/[id]/page.tsx` regex-parses it into inline styles.

### Conversation screen (`DialogueScene.tsx`)
Built for grade 10 English learners:
- **Live expressions:** the customer's face (happy / neutral / upset rows of `sushi/4.png`) follows mood. The chef smiles after a polite reply.
- **Reactions:** a happy or angry bubble (`sushi/7.png`), a floating "+25 ♥" / "−50 ♥", and a hop or head-shake.
- **Typewriter text:** click, Enter or Space skips it. Replies appear only after the line finishes.
- **Voice:** the Web Speech API reads each customer line and the player's reply at a slightly slower rate. There's a "Listen" replay button and a mute toggle.
- **Vocabulary:** `vocab` words are highlighted. Tapping one shows a learner-friendly definition.
- **Language tip:** after each reply, a Polite / Okay / Could be better card explains why, using the choice's `tip`. Then the player presses Continue.
- **Shuffled replies:** choices are shuffled per node (deterministically), so the polite answer isn't always first. Keys 1–9 pick a reply.
- **Conversation log:** a side drawer shows the full transcript.
- **Ambience:** flickering lantern glow, a vignette and idle "breathing" on the characters.

### Content status

| Level | Restaurant | Guests | Dishes | Animated steps | Art |
|---|---|---|---|---|---|
| r1 | Sakura Sushi (Japanese) | Daniel, Emma, Mrs. Sato | nigiri ×3, ikura gunkan, salmon roll, avocado-cucumber roll | Shape rice, wasabi, slice fish/avocado/cucumber, wrap nori, spoon roe, spread rice, Roll, Cut | Real sprite sheets |
| r2 | Bella Trattoria (Italian) | Sofia, Nonna Lucia | Margherita, Mushroom Pizza, 2 spaghetti | Knead, Stretch, spread sauce, place toppings, Bake, Cut; Boil, ladle sauce, Toss, grate parmesan | Mockup SVG |
| r3 | Spicy Market (Thai som tam shop) | Mr. Somchai, Mai | Som Tam Poo (3 chilies, salted crab), Som Tam Thai no peanuts (1 chili) | Pound, halve tomatoes, fish sauce, lime, palm sugar, Mix | Mockup SVG |
| r4 | Lumière Café (Dessert) | Mrs. Dubois, Chloe | Berry Macaron Tower, Strawberry / Blueberry Pancakes | Pour batter, Flip (two sides, ×2), syrup, place berries | Mockup SVG |
| r5 | Route 66 (American Diner) | Jess, Hank | Cheeseburger (± lettuce), French Fries (± salt) | Season, Grill (two sides), slice tomato; Peel, Cut, Fry, Salt | Mockup SVG |

All five levels are playable end to end.

Ingredients carry a `kitchen` (`sushi`, `italian`, `thai`, `cafe` or `diner`) and each restaurant shows only its own, plus shared tools (Cut). Sushi: rice, salmon, tuna, nori_flat, avocado, cucumber, ikura, wasabi, ginger, soy_sauce, nori_wrap, rice_sheet + Roll. Italian: dough, tomato_sauce, mozzarella, basil, mushroom, spaghetti, parmesan + Knead, Stretch, Boil, Bake, Toss. Diner tools: Season, Grill, Fry, Peel.

**r2–r5 art is mockup.** Everything in `public/assets/food/{italian,thai,cafe,diner}/` is generated SVG from `scripts/italian_mockups.py` and `scripts/more_mockups.py` (run `cd scripts && python3 italian_mockups.py && python3 more_mockups.py`). Characters still come from the sushi sheet `sushi/4.png` for every level. Replace the files with real art under the same names; plate layers share one 512×512 canvas centred on (256, 270) so toppings line up with the pizza.

## Known issues / bugs

1. **Sushi recipes follow the sprite sheet.** Only dishes buildable from `sushi/1.png` and `sushi/steps/` exist. Ebi and tamago were removed because there is no art for them.
2. **Shared characters.** Every level uses the same chef and the 3 customers from `sushi/4.png`. Node-level `customerImage` is unused (removed from r2–r5).
3. **Tailwind classes stored in JSON.** Sprite classes in `data/*.json` only work if Tailwind v4's source detection scans those files. If sprites go missing after a build, add `@source "../data";` to `globals.css`.
4. Loose typing (`as any`) throughout `play/[id]/page.tsx`. `restaurants.json` objects don't share a typed interface with the code.
5. `restaurants.json` `themeColors` are defined but never used.
6. `npm install` reports 10 vulnerabilities (1 critical).

## Suggested next steps

1. Replace the r2–r5 mockup SVGs and give each restaurant its own chef and customer sprites.
2. Add TypeScript types for the JSON data plus a small validation script that checks every `next`, `recipeId` and ingredient id resolves.
3. Use the existing `themeColors`.
4. Replace the personal-use-only Avermont font before any public or commercial release.
