"use client";

import { motion, AnimatePresence } from "framer-motion";
import ingredientsData from "@/data/ingredients.json";
import assemblyData from "@/data/assembly.json";

type Cell = number[]; // [column, row] in the 4x4 sheet /assets/food/sushi/1.png

interface PlateLayout {
  size: number; // width as % of the plate area
  x: number; // offset from centre, % of the plate area
  y: number;
  lift: number; // how far (in %) layers placed after this one sit higher
  base?: boolean; // wraps around the layers below instead of sitting on top
  side?: boolean; // garnish placed beside the dish, outside the stack
}

interface Pieces {
  sprite?: Cell;
  image?: string;
  count: number;
}

export type Final = Pieces;

interface Ingredient {
  id: string;
  name: string;
  sprite?: Cell;
  plate?: PlateLayout;
  action?: boolean; // a step such as Roll or Cut, not something placed on the plate
}

interface Composite {
  image?: string;
  plate?: PlateLayout;
  pieces?: Pieces;
}

const ingredients = ingredientsData as Ingredient[];
const assembly = assemblyData as {
  composites: Record<string, Composite>;
  merges: { from: string[]; into: string }[];
  roll: { base: string; fillings: Record<string, string> };
  cut: Record<string, string>;
};

// Food on the plate is drawn a bit larger than the raw layout numbers so it fills the plate.
const PLATE_SCALE = 1.5;

export function spriteCell([col, row]: Cell): React.CSSProperties {
  return {
    backgroundImage: "url('/assets/food/sushi/1.png')",
    backgroundSize: "400% 400%",
    backgroundPosition: `${col * 33.333}% ${row * 33.333}%`,
    backgroundRepeat: "no-repeat",
  };
}

type Visual = { id: string; plate: PlateLayout; sprite?: Cell; image?: string; pieces?: Pieces };

function visualFor(id: string): Visual | null {
  const comp = assembly.composites[id];
  if (comp) return { id, plate: comp.plate ?? { size: 0, x: 0, y: 0, lift: 0 }, image: comp.image, pieces: comp.pieces };
  const ing = ingredients.find((i) => i.id === id);
  return ing?.plate ? { id, plate: ing.plate, sprite: ing.sprite } : null;
}

// Replays what the player did and works out what is physically on the plate:
// nori + rice sheet become one sheet, Roll turns the sheet and its fillings into a roll, Cut slices it.
function buildPlate(ids: string[]): Visual[] {
  const layers: Visual[] = [];
  const topIndex = () => layers.findLastIndex((l) => !l.plate.side);

  for (const id of ids) {
    if (id === "roll") {
      const baseAt = layers.findIndex((l) => l.id === assembly.roll.base);
      if (baseAt === -1) continue;
      const fillings = layers.slice(baseAt + 1).filter((l) => !l.plate.side);
      const into = fillings.map((f) => assembly.roll.fillings[f.id]).find(Boolean);
      if (!into) continue;
      const sides = layers.filter((l, i) => i < baseAt || l.plate.side);
      layers.splice(0, layers.length, ...sides, visualFor(into)!);
      continue;
    }
    if (id === "cut") {
      const at = topIndex();
      const into = at >= 0 ? assembly.cut[layers[at].id] : undefined;
      if (into) layers[at] = visualFor(into)!;
      continue;
    }

    const next = visualFor(id);
    if (!next) continue;
    const at = topIndex();
    const merge = at >= 0 && !next.plate.side && assembly.merges.find((m) => m.from[0] === layers[at].id && m.from[1] === id);
    if (merge) layers[at] = visualFor(merge.into)!;
    else layers.push(next);
  }
  return layers;
}

// Each layer sits on top of the ones below it, in the order it was added.
function layoutStack(layers: Visual[]) {
  let lift = 0;
  let baseLift = 0;
  return layers.map((v, index) => {
    const p = v.plate;
    const rise = p.side ? 0 : p.base ? baseLift : lift;
    if (!p.side) {
      if (!p.base) baseLift = lift;
      lift += p.lift;
    }
    return {
      key: `${v.id}-${index}`,
      visual: v,
      top: 50 + (p.y - rise) * PLATE_SCALE,
      left: 50 + p.x * PLATE_SCALE,
      width: p.size * PLATE_SCALE,
      z: p.side ? 1 : 10 + index,
    };
  });
}

function Art({ visual }: { visual: { sprite?: Cell; image?: string } }) {
  if (visual.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={visual.image} alt="" draggable={false} className="w-full h-auto select-none" />;
  }
  return <div className="w-full aspect-square" style={spriteCell(visual.sprite!)} />;
}

// Positions and centres a layer. The centring lives on this plain wrapper, not inside the
// animated element: Safari clips a drop-shadow filter to its element's box, so a child shifted
// outside that box (e.g. translate -50%) would only show its bottom-right quarter.
function Spot({ left, top, width, z, rotate = 0, children }: { left: number; top: number; width: number; z: number; rotate?: number; children: React.ReactNode }) {
  return (
    <div className="absolute" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, zIndex: z, transform: `translate(-50%, -50%) rotate(${rotate}deg)` }}>
      {children}
    </div>
  );
}

const SHADOW = "drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]";

// Where served pieces go, as [x, y, rotation] offsets in % of the area.
const PIECE_SPOTS: Record<number, number[][]> = {
  1: [[0, 0, 0]],
  2: [[-14, 0, -6], [14, 3, 6]],
  6: [[-22, -9, -4], [0, -11, 0], [22, -9, 4], [-22, 11, -4], [0, 9, 0], [22, 11, 4]],
};

export function ServedPieces({ pieces, size, spread = 1.12, offsetY = 0, delay = 0 }: { pieces: Pieces; size?: number; spread?: number; offsetY?: number; delay?: number }) {
  const spots = PIECE_SPOTS[pieces.count] ?? PIECE_SPOTS[1];
  const width = size ?? (pieces.count >= 6 ? 30 : 44);
  return (
    <>
      {spots.map(([x, y, r], i) => (
        <Spot key={i} left={50 + x * spread} top={50 + offsetY + y * spread} width={width} z={40 + Math.round(y)} rotate={r}>
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + i * 0.06, type: "spring", bounce: 0.5 }}
            className={SHADOW}
          >
            <Art visual={pieces} />
          </motion.div>
        </Spot>
      ))}
    </>
  );
}

// The plate area is lifted for stacked layers; served pieces drop back to the plate centre.
const PIECES_ON_PLATE_Y = 9;

// Knife chops along the roll (lower-left to upper-right) a few times before the slices fall apart.
const CHOP_MS = 900;
function KnifeChop() {
  const xs = [26, 38, 50, 62, 74];
  const ys = [60, 54, 48, 42, 36];
  return (
    <motion.div
      className="absolute w-[30%] aspect-[3/2] z-[60] pointer-events-none"
      style={{ backgroundImage: "url('/assets/food/sushi/2.png')", backgroundSize: "300% 200%", backgroundPosition: "0% 0%", translateX: "-30%", translateY: "-80%", rotate: 20 }}
      initial={{ opacity: 0 }}
      animate={{
        left: xs.flatMap((x) => [`${x}%`, `${x}%`]),
        top: ys.flatMap((y) => [`${y - 14}%`, `${y}%`]),
        opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      }}
      transition={{ duration: CHOP_MS / 1000, ease: "easeInOut" }}
    />
  );
}

// Live plate in the kitchen. Once the plate matches the recipe, it is served as the finished dish.
export function PlateStack({ ids, final, complete }: { ids: string[]; final?: Final; complete: boolean }) {
  const layers = buildPlate(ids);
  const placed = layoutStack(layers);
  const justCut = ids[ids.length - 1] === "cut" && layers.some((l) => l.pieces);
  const uncut = justCut ? layoutStack(buildPlate(ids.slice(0, -1))).find((l) => l.visual.id.startsWith("roll_")) : undefined;
  const showFinal = complete && !!final;

  return (
    <div className="absolute inset-0">
      {justCut && <KnifeChop key={`knife-${ids.length}`} />}
      {uncut && (
        <Spot key={`uncut-${ids.length}`} left={uncut.left} top={uncut.top} width={uncut.width} z={20}>
          <motion.div
            className={SHADOW}
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0] }}
            transition={{ duration: CHOP_MS / 1000 + 0.1, times: [0, 0.85, 1] }}
          >
            <Art visual={uncut.visual} />
          </motion.div>
        </Spot>
      )}
      <AnimatePresence>
        {!showFinal &&
          placed.map(({ key, visual, top, left, width, z }) =>
            visual.pieces ? (
              <motion.div key={key} className="absolute inset-0" style={{ zIndex: z }} exit={{ opacity: 0 }}>
                <ServedPieces pieces={visual.pieces} offsetY={PIECES_ON_PLATE_Y} delay={CHOP_MS / 1000} />
              </motion.div>
            ) : (
              <Spot key={key} left={left} top={top} width={width} z={z}>
                <motion.div
                  initial={visual.id.startsWith("roll_") ? { opacity: 0, scaleY: 0.3 } : { y: -200, opacity: 0, scale: 0.5, rotate: -15 }}
                  animate={{ y: 0, opacity: 1, scale: 1, scaleY: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", bounce: 0.45, duration: 0.6 }}
                  className={SHADOW}
                >
                  <Art visual={visual} />
                </motion.div>
              </Spot>
            )
          )}
        {showFinal && (
          <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30">
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(255,236,170,0.7),transparent_65%)]"
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <ServedPieces pieces={final!} offsetY={PIECES_ON_PLATE_Y} delay={justCut ? CHOP_MS / 1000 : 0} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Picture of the served dish for the result card.
export function DishPreview({ final }: { final: Final }) {
  return (
    <div className="relative w-full h-full">
      <ServedPieces pieces={final} size={final.count >= 6 ? 38 : 56} spread={final.count >= 6 ? 1.5 : 1.4} />
    </div>
  );
}
