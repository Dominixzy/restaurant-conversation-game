"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Art, PlateStack, spriteCell, type StepAnim, type Visual } from "./Dish";
import { sfx } from "@/lib/sfx";

type Of<T extends StepAnim["type"]> = Extract<StepAnim, { type: T }>;
type P = { x: number; y: number };

// What an animation draws with: the plate as it is now, what the step turns it into, and the ingredient's bin icon.
interface Ctx<A extends StepAnim = StepAnim> {
  anim: A;
  ids: string[];
  before: Visual | null; // top layer of the plate before the step
  after: Visual | null; // top layer once the step is done (the baked pizza, the cooked patty…)
  reshapes: boolean; // the step turns `before` into `after` (raw patty → cooked), so the two can cross-fade
  icon?: string;
}

// The stage is 100 units wide and 75 tall, so x and y use the same scale.
const H = 75;
const CENTRE = { x: 50, y: H / 2 };

// How long each kind of step takes to play, in seconds.
function duration(a: StepAnim) {
  switch (a.type) {
    case "cook": return (a.sides ?? 1) > 1 ? 3.2 : 2.4;
    case "swipe": return 0.2 + a.cuts.length * 0.45;
    case "scatter": return 0.25 + a.spots.length * 0.28;
    case "stir": return Math.max(1, a.turns * 0.75);
    case "pound": return 0.2 + a.chunks * 2 * 0.12;
    case "measure": return 1.3;
    case "spread":
    case "roll": return 1.6;
    case "stretch": return 1.4;
  }
}

// What appears when the step is done.
function doneLabel(a: StepAnim) {
  if (a.done) return a.done;
  switch (a.type) {
    case "cook": return "Done!";
    case "swipe": return "Clean cuts!";
    case "spread": return "Nice and even!";
    case "scatter": return "Nicely placed!";
    case "measure": return a.look === "press" ? "Nice shape!" : "Just right!";
    case "stir": return a.look === "wrap" ? "Wrapped!" : a.look === "knead" ? "Smooth dough!" : "Well mixed!";
    case "roll": return "Tight roll!";
    case "stretch": return "Perfect size!";
    case "pound": return "Smooth paste!";
  }
}

// The sound that runs for the whole step (sizzling, pouring…), or nothing.
function ongoingSound(a: StepAnim, seconds: number) {
  switch (a.type) {
    case "cook":
      return a.vessel === "pot" ? sfx.boil(seconds) : a.vessel === "oven" ? sfx.oven(seconds) : a.vessel === "fryer" ? sfx.fry(seconds) : sfx.sizzle(seconds);
    case "spread": return a.brush === "dots" ? sfx.shake(seconds) : sfx.brush(seconds);
    case "measure": return a.look === "press" ? null : sfx.pour(seconds * 0.76, seconds * 0.12);
    case "roll": return sfx.roll(seconds);
    default: return null;
  }
}

// How many "beats" of the animation have happened by progress p: each one plays `beat`.
function beats(a: StepAnim, p: number): { count: number; beat: () => void } | null {
  switch (a.type) {
    case "swipe": return { count: Math.min(a.cuts.length, Math.floor(p * a.cuts.length) + (p > 0 ? 1 : 0)), beat: sfx.chop };
    case "scatter": return { count: Math.min(a.spots.length, Math.floor(p * a.spots.length + 0.35)), beat: sfx.pop };
    case "pound": return { count: Math.min(a.chunks * 2, Math.floor(p * a.chunks * 2)), beat: sfx.thud };
    case "stir": return { count: Math.floor(p * a.turns * 2), beat: () => sfx.swish(0.3) };
    case "stretch": return { count: Math.floor(p * 5), beat: () => sfx.swish(0.25) };
    case "measure": return a.look === "press" ? { count: Math.floor(p * 2 + 0.5), beat: sfx.thud } : null;
    case "cook": return (a.sides ?? 1) > 1 ? { count: p >= 0.5 ? 1 : 0, beat: sfx.flip } : null;
    default: return null;
  }
}

function useStepSounds(anim: StepAnim, p: number) {
  const stop = useRef<(() => void) | null>(null);
  const played = useRef(0);
  useEffect(() => {
    stop.current = ongoingSound(anim, duration(anim));
    return () => stop.current?.();
  }, [anim]);
  useEffect(() => {
    const b = beats(anim, p);
    if (b && b.count > played.current) {
      played.current = b.count;
      b.beat();
    }
    if (p >= 1) {
      stop.current?.();
      sfx.ding();
    }
  }, [anim, p]);
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// The kitchen does a step by itself in a small card beside the plate: plays its animation, shows how it
// turned out, then calls onDone. Tapping the card skips to the end. `className` positions the card.
export default function StepAnimation({ anim, name, ids, before, after, reshapes, icon, onDone, className = "" }: {
  anim: StepAnim; name: string; ids: string[]; before: Visual | null; after: Visual | null; reshapes: boolean; icon?: string; onDone: () => void; className?: string;
}) {
  const [p, setP] = useState(0);
  const skipped = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // Progress comes from the clock, so the animation takes the same time at any frame rate.
  useEffect(() => {
    const start = performance.now();
    const length = duration(anim) * 1000;
    let raf = 0;
    const tick = (now: number) => {
      // (a frame's timestamp can be a little earlier than `start`)
      const next = skipped.current ? 1 : Math.max(0, Math.min(1, (now - start) / length));
      setP(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim]);

  useStepSounds(anim, p);

  const finished = p >= 1;
  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => onDoneRef.current(), 750);
    return () => clearTimeout(t);
  }, [finished]);

  const ctx: Ctx = { anim, ids, before, after, reshapes, icon };
  return (
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.4 }}
        onClick={() => (skipped.current = true)}
        title="Tap to skip"
        className={`cursor-pointer pointer-events-auto bg-[#fffaf0] rounded-2xl border-[3px] border-orange-400 shadow-2xl p-2 text-center ${className}`}
      >
        <p className="font-luckiest-guy text-sm md:text-base text-orange-600 tracking-wide mb-1 leading-tight">{anim.title ?? name}</p>

        {anim.type === "cook" && <Cook ctx={ctx as Ctx<Of<"cook">>} p={p} />}
        {anim.type === "swipe" && <Swipe ctx={ctx as Ctx<Of<"swipe">>} p={p} />}
        {anim.type === "spread" && <Spread ctx={ctx as Ctx<Of<"spread">>} p={p} />}
        {anim.type === "scatter" && <Scatter ctx={ctx as Ctx<Of<"scatter">>} p={p} />}
        {anim.type === "measure" && <Measure ctx={ctx as Ctx<Of<"measure">>} p={p} />}
        {anim.type === "stir" && <Stir ctx={ctx as Ctx<Of<"stir">>} p={p} />}
        {anim.type === "roll" && <Roll ctx={ctx as Ctx<Of<"roll">>} p={p} />}
        {anim.type === "stretch" && <Stretch ctx={ctx as Ctx<Of<"stretch">>} p={p} />}
        {anim.type === "pound" && <Pound ctx={ctx as Ctx<Of<"pound">>} p={p} />}

        <div className="mt-1.5 h-1.5 rounded-full bg-stone-200 overflow-hidden">
          <div className="h-full bg-orange-400" style={{ width: `${p * 100}%` }} />
        </div>

        <AnimatePresence>
          {finished && (
            <motion.p
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 font-luckiest-guy text-2xl md:text-3xl leading-none tracking-wide text-green-500 drop-shadow-[0_2px_0_rgba(0,0,0,0.35)] pointer-events-none"
              style={{ WebkitTextStroke: "2px white" }}
            >
              {doneLabel(anim)}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
  );
}

// --- shared pieces ---------------------------------------------------------------------------

const SURFACES = {
  board: { background: "repeating-linear-gradient(8deg, #e6b67f 0 14px, #dcaa72 14px 15px, #e9bc86 15px 30px)" },
  mat: { backgroundImage: "url('/assets/food/sushi/2.webp')", backgroundSize: "300% 200%", backgroundPosition: "0% 100%", backgroundColor: "#c99a5c" },
  stove: { background: "radial-gradient(circle at 50% 45%, #4a4a4a, #1f1f1f 75%)" },
} as const;

function Stage({ surface = "board", children }: { surface?: keyof typeof SURFACES; children: React.ReactNode }) {
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-stone-700 shadow-inner select-none pointer-events-none" style={SURFACES[surface]}>
      {children}
    </div>
  );
}

// Places a box of `size` units centred on (x, y).
const box = (x: number, y: number, size: number): React.CSSProperties => ({
  position: "absolute",
  left: `${x - size / 2}%`,
  top: `${((y - size / 2) / H) * 100}%`,
  width: `${size}%`,
  aspectRatio: "1",
});
const at = (x: number, y: number): React.CSSProperties => ({ position: "absolute", left: `${x}%`, top: `${(y / H) * 100}%` });

// What the step works on: its own picture if it names one, otherwise the plate as it is now.
function Food({ ctx, pic, style, size }: { ctx: Ctx; pic?: Visual | null; style?: React.CSSProperties; size?: number }) {
  const { anim } = ctx;
  const s = size ?? anim.size ?? 75;
  return (
    <div style={{ ...box(50, H / 2, s), ...style }} className="isolate flex items-center justify-center">
      {anim.backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={anim.backdrop} alt="" className="absolute inset-0 w-full h-full" draggable={false} />
      )}
      <div className="relative w-full h-full flex items-center justify-center" style={{ transform: anim.rotate ? `rotate(${anim.rotate}deg)` : undefined }}>
        {anim.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={anim.image} alt="" className="w-full h-auto drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]" draggable={false} />
        ) : anim.sprite ? (
          <div className="w-full aspect-square drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]" style={spriteCell(anim.sprite)} />
        ) : pic ? (
          <div className="w-full drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]"><Art visual={pic} /></div>
        ) : (
          <PlateStack ids={ctx.ids} complete={false} still />
        )}
      </div>
    </div>
  );
}

// The ingredient's bin icon used as the tool in hand (sauce ladle, salt shaker, peeler…).
function Tool({ ctx, x, y, size = 16, rotate = 0 }: { ctx: Ctx; x: number; y: number; size?: number; rotate?: number }) {
  return <div className={`drop-shadow-lg z-20 ${ctx.icon ?? ""}`} style={{ ...box(x, y, size), rotate: `${rotate}deg` }} />;
}

function Bubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute top-1 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] md:text-xs font-black shadow-lg bg-white text-stone-700"
    >
      {text}
    </motion.div>
  );
}

// --- cook: pot, oven, pan, grill, fryer ---------------------------------------------------------

function Vessel({ kind, heat }: { kind: Of<"cook">["vessel"]; heat: number }) {
  const bubbles = (colour: string, n: number, rx: number, ry: number, cy = H / 2) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i * 137.5 * Math.PI) / 180;
      const r = 0.35 + ((i * 53) % 60) / 100;
      return (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ ...at(50 + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r), width: 5 + (i % 3) * 3, height: 5 + (i % 3) * 3, borderColor: colour }}
          animate={{ scale: [0.3, 1, 0.3], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.9 + (i % 4) * 0.2, repeat: Infinity, delay: (i % 5) * 0.17 }}
        />
      );
    });
  switch (kind) {
    case "oven":
      return (
        <>
          <div className="absolute inset-[6%] rounded-t-[45%] rounded-b-xl bg-[#2a1408] border-[6px] border-[#9c4426]" />
          <motion.div
            className="absolute inset-[10%] rounded-t-[45%] rounded-b-xl bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,150,40,0.9),rgba(255,90,20,0.25)_55%,transparent_75%)]"
            animate={{ opacity: [0.6, 1, 0.75, 1, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </>
      );
    case "pot":
      return (
        <>
          <div className="absolute rounded-[50%] bg-[#8f9aa3] border-[5px] border-stone-700" style={{ ...at(12, 6), width: "76%", height: "84%" }} />
          <div className="absolute rounded-[50%] bg-[radial-gradient(circle,#cfe6f2,#86b6d1)]" style={{ ...at(17, 11), width: "66%", height: "71%" }} />
          {bubbles("rgba(255,255,255,0.9)", 12, 26, 18)}
        </>
      );
    case "pan":
      return (
        <>
          <div className="absolute h-[9%] w-[30%] rounded-full bg-stone-800 border-4 border-stone-900" style={at(78, 33)} />
          <div className="absolute rounded-full bg-[radial-gradient(circle_at_45%_40%,#4b4b4b,#151515)] border-[6px] border-stone-900" style={{ ...at(12, 2), width: "70%", height: "94%" }} />
          {bubbles(`rgba(255,220,150,${0.3 + heat * 0.6})`, 8, 26, 26, H / 2)}
        </>
      );
    case "grill":
      return (
        <>
          <div className="absolute inset-[5%] rounded-2xl bg-[#232323] border-4 border-stone-900" />
          <motion.div
            className="absolute inset-x-[8%] bottom-[8%] h-1/2 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,110,30,0.8),transparent_70%)]"
            animate={{ opacity: [0.5, 1, 0.6, 0.9, 0.5] }}
            transition={{ duration: 1.3, repeat: Infinity }}
          />
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="absolute top-[8%] bottom-[8%] w-[2%] bg-stone-500 rounded" style={{ left: `${12 + i * 9.5}%` }} />
          ))}
        </>
      );
    case "fryer":
      return (
        <>
          <div className="absolute inset-[4%] rounded-2xl bg-[#9aa6b0] border-4 border-stone-700" />
          <div className="absolute inset-[10%] rounded-xl bg-[radial-gradient(circle,#ffd66b,#d99a1c)]" />
          {bubbles("rgba(255,250,210,0.95)", 16, 36, 24)}
          <div className="absolute inset-[16%] rounded-lg border-4 border-stone-500/70 [background:repeating-linear-gradient(90deg,transparent_0_10px,rgba(80,80,80,0.35)_10px_12px)]" />
        </>
      );
  }
}

// Raw food looks pale and washed out, then takes on its cooked colour.
const rawLook = (d: number) => (d >= 1 ? "none" : `saturate(${0.3 + 0.7 * d}) brightness(${1.25 - 0.25 * d})`);

function Cook({ ctx, p }: { ctx: Ctx<Of<"cook">>; p: number }) {
  const { anim } = ctx;
  const sides = anim.sides ?? 1;
  // With two sides it cooks one, flips halfway, then cooks the other (the cooked side now faces up).
  const side = sides > 1 && p >= 0.5 ? 1 : 0;
  const d = sides > 1 ? (side ? 1 : p * 2) : p;
  const crossFade = ctx.reshapes && ctx.before && ctx.after && ctx.before.id !== ctx.after.id;
  return (
    <Stage surface="stove">
      <Vessel kind={anim.vessel} heat={Math.min(1, p * 1.5)} />
      <motion.div
        key={side}
        className="absolute inset-0"
        initial={side ? { rotateX: 180, y: -30 } : false}
        animate={{ rotateX: 0, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {crossFade && <Food ctx={ctx} pic={ctx.before} style={{ opacity: 1 - d, filter: rawLook(d) }} />}
        <Food ctx={ctx} pic={ctx.after ?? ctx.before} style={{ opacity: crossFade ? d : 1, filter: rawLook(d) }} />
      </motion.div>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-[16%] aspect-square rounded-full blur-md"
          style={{ ...at(28 + i * 13, 30), background: `rgba(255,255,255,${0.15 + Math.min(1, p * 1.5) * 0.35})` }}
          animate={{ y: [0, -60], opacity: [0, 1, 0], scale: [0.6, 1.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.33 }}
        />
      ))}
      {sides > 1 && <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] font-black px-1.5 rounded-full">{side ? "Flipped!" : "Side 1"}</div>}
      {anim.hint && p > 0.85 && <Bubble text={anim.hint} />}
    </Stage>
  );
}

// --- swipe: the knife cuts along each line -----------------------------------------------------

function Swipe({ ctx, p }: { ctx: Ctx<Of<"swipe">>; p: number }) {
  const { cuts } = ctx.anim;
  const progress = p * cuts.length;
  const current = Math.floor(progress);
  const along = progress - current;
  const ends = cuts.map((c) => {
    const r = (c.angle * Math.PI) / 180;
    const dx = (Math.cos(r) * c.length) / 2;
    const dy = (Math.sin(r) * c.length) / 2;
    return { a: { x: c.x - dx, y: c.y - dy }, b: { x: c.x + dx, y: c.y + dy } };
  });
  const knife = current < cuts.length ? { x: ends[current].a.x + (ends[current].b.x - ends[current].a.x) * along, y: ends[current].a.y + (ends[current].b.y - ends[current].a.y) * along } : null;
  return (
    <Stage>
      <Food ctx={ctx} pic={ctx.before} />
      <svg viewBox={`0 0 100 ${H}`} className="absolute inset-0 w-full h-full">
        {ends.map(({ a, b }, i) => {
          const f = i < current ? 1 : i === current ? along : 0;
          return (
            <g key={i}>
              {f < 1 && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={0.5} strokeDasharray="2 1.8" opacity={0.6} />}
              {f > 0 && <line x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * f} y2={a.y + (b.y - a.y) * f} stroke="#3b1d0a" strokeWidth={1.1} strokeLinecap="round" opacity={0.85} />}
            </g>
          );
        })}
      </svg>
      {knife && (
        <div
          className="absolute w-[22%] aspect-[3/2] z-20"
          style={{ ...at(knife.x, knife.y), backgroundImage: "url('/assets/food/sushi/2.webp')", backgroundSize: "300% 200%", backgroundPosition: "0% 0%", transform: "translate(-88%, -88%)" }}
        />
      )}
    </Stage>
  );
}

// --- spread: sauce, rice or seasoning is brushed over the area -----------------------------------

// A back-and-forth path covering the shape, row by row.
function zigzag(shape: Of<"spread">["shape"], radius: number) {
  const pts: P[] = [];
  const step = radius * 1.3;
  let flip = false;
  for (let y = shape.y - shape.ry + radius * 0.6; y <= shape.y + shape.ry - radius * 0.3; y += step) {
    const t = (y - shape.y) / shape.ry;
    const half = shape.rect ? shape.rx : shape.rx * Math.sqrt(Math.max(0, 1 - t * t));
    const xs = [shape.x - Math.max(0, half - radius * 0.6), shape.x + Math.max(0, half - radius * 0.6)];
    if (flip) xs.reverse();
    pts.push({ x: xs[0], y }, { x: xs[1], y });
    flip = !flip;
  }
  return pts;
}

function pointAlong(pts: P[], f: number) {
  const lens = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
  let left = lens.reduce((a, b) => a + b, 0) * f;
  for (let i = 0; i < lens.length; i++) {
    if (left <= lens[i]) {
      const k = lens[i] ? left / lens[i] : 0;
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
    }
    left -= lens[i];
  }
  return pts[pts.length - 1];
}

function Spread({ ctx, p }: { ctx: Ctx<Of<"spread">>; p: number }) {
  const { anim } = ctx;
  const { shape, colors } = anim;
  const radius = anim.radius ?? 6;
  const path = useMemo(() => zigzag(shape, radius), [shape, radius]);
  const head = pointAlong(path, p);
  const id = `spread-${useId().replace(/:/g, "")}`;
  const area = shape.rect
    ? <rect x={shape.x - shape.rx} y={shape.y - shape.ry} width={shape.rx * 2} height={shape.ry * 2} rx={1.5} />
    : <ellipse cx={shape.x} cy={shape.y} rx={shape.rx} ry={shape.ry} />;
  return (
    <Stage>
      <Food ctx={ctx} pic={ctx.before} />
      <svg viewBox={`0 0 100 ${H}`} className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id={`${id}-dots`} width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="0.8" cy="0.9" r="0.45" fill={colors[0]} />
            <circle cx="2.3" cy="2.2" r="0.4" fill={colors[1] ?? colors[0]} />
            <circle cx="2.2" cy="0.5" r="0.3" fill={colors[2] ?? colors[0]} />
          </pattern>
          <pattern id={`${id}-rice`} width="3.2" height="2.6" patternUnits="userSpaceOnUse">
            <rect width="3.2" height="2.6" fill={colors[0]} />
            <ellipse cx="0.9" cy="0.8" rx="0.8" ry="0.45" fill={colors[1] ?? "#fff"} />
            <ellipse cx="2.4" cy="1.9" rx="0.8" ry="0.45" fill={colors[2] ?? colors[1] ?? "#fff"} transform="rotate(30 2.4 1.9)" />
          </pattern>
          <mask id={`${id}-mask`}>
            <polyline
              points={path.map((q) => `${q.x},${q.y}`).join(" ")}
              fill="none" stroke="#fff" strokeWidth={radius * 2} strokeLinecap="round" strokeLinejoin="round"
              pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p}
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-mask)`} fill={anim.brush === "solid" ? colors[0] : `url(#${id}-${anim.brush})`}>{area}</g>
      </svg>
      {p < 1 && <Tool ctx={ctx} x={head.x + 4} y={head.y - 6} rotate={-20} />}
    </Stage>
  );
}

// --- scatter: toppings drop onto their spots ----------------------------------------------------

function Scatter({ ctx, p }: { ctx: Ctx<Of<"scatter">>; p: number }) {
  const { spots } = ctx.anim;
  const piece = ctx.anim.piece ?? 13;
  const placed = Math.min(spots.length, Math.floor(p * spots.length + 0.35));
  return (
    <Stage>
      <Food ctx={ctx} />
      {spots.slice(0, placed).map(([x, y], i) => (
        <motion.div
          key={i}
          style={box(x, y, piece)}
          initial={{ y: -40, opacity: 0, scale: 1.4 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          <div className={`w-full h-full drop-shadow-md ${ctx.icon ?? ""}`} style={{ rotate: `${(i * 67) % 50 - 25}deg` }} />
        </motion.div>
      ))}
    </Stage>
  );
}

// --- measure: a bottle or spoon pours, or hands press the rice -------------------------------------

function Measure({ ctx, p }: { ctx: Ctx<Of<"measure">>; p: number }) {
  const { anim } = ctx;
  const colour = anim.color ?? "#c0392b";
  if (anim.look === "press") {
    // Hands press down twice, squeezing the rice into shape.
    const push = Math.abs(Math.sin(p * Math.PI * 2));
    return (
      <Stage>
        <div style={box(50, 42, 52)} className="flex items-end justify-center">
          <div className={`w-full h-full drop-shadow-lg origin-bottom ${ctx.icon ?? ""}`} style={{ transform: `scale(${1 + push * 0.12}, ${1 - push * 0.18})` }} />
          <div className="absolute -top-[8%] left-[18%] w-[64%] h-[38%] rounded-t-[40%] rounded-b-2xl bg-[#f2c9a0] border-4 border-stone-700" style={{ translate: `0 ${push * 22}%` }} />
        </div>
      </Stage>
    );
  }
  const pouring = p > 0.12 && p < 0.88;
  return (
    <Stage>
      <Food ctx={ctx} size={58} style={{ left: "21%", top: "18%" }} />
      <div
        className={`absolute w-[22%] aspect-square drop-shadow-lg transition-transform duration-200 ${ctx.icon ?? ""}`}
        style={{ left: "40%", top: "2%", transformOrigin: "20% 80%", transform: `rotate(${pouring ? -70 : -10}deg)` }}
      />
      {pouring && (
        <motion.div
          className="absolute w-[2.4%] rounded-full origin-top"
          style={{ left: "42%", top: "26%", height: "28%", background: colour }}
          animate={{ scaleY: [1, 0.9, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}
    </Stage>
  );
}

// --- stir: a spoon (or hands) goes round -------------------------------------------------------

function Stir({ ctx, p }: { ctx: Ctx<Of<"stir">>; p: number }) {
  const { anim } = ctx;
  const angle = p * anim.turns * Math.PI * 2;
  const hand = { x: CENTRE.x + Math.cos(angle) * 22, y: CENTRE.y + Math.sin(angle) * 15 };
  const foodStyle: React.CSSProperties =
    anim.look === "knead" ? { transform: `scale(${1 + Math.sin(angle * 2) * 0.08}, ${1 - Math.sin(angle * 2) * 0.08})` }
    : anim.look === "wrap" ? {}
    : { transform: `rotate(${((angle * 180) / Math.PI) * 0.15}deg)` };
  return (
    <Stage>
      <Food ctx={ctx} style={foodStyle} />
      {anim.look === "wrap" && (
        // The nori band closes around the rice.
        <div style={{ ...box(50, H / 2 + 2, 42), opacity: p, transform: `scale(${1.25 - p * 0.25})` }} className={ctx.icon ?? ""} />
      )}
      {anim.look === "stir" || !anim.look
        ? <div className="absolute w-[16%] aspect-square bg-[url('/assets/food/thai/icons/spoon.webp')] bg-contain bg-no-repeat" style={{ ...at(hand.x, hand.y), translate: "-50% -70%" }} />
        : <div className="absolute w-[11%] aspect-square rounded-full bg-[#f2c9a0] border-4 border-stone-700" style={{ ...at(hand.x, hand.y), translate: "-50% -50%" }} />}
    </Stage>
  );
}

// --- roll: the bamboo mat rolls up -------------------------------------------------------------

function Roll({ ctx, p }: { ctx: Ctx<Of<"roll">>; p: number }) {
  const t = ease(p);
  const handleY = 66 - t * 50;
  return (
    <Stage surface="mat">
      {/* The sheet folds away from the bottom as the roll forms on top of it */}
      <div className="absolute inset-0 origin-top" style={{ transform: `scaleY(${1 - t * 0.85})`, opacity: 1 - t * 0.8 }}>
        <Food ctx={ctx} size={78} />
      </div>
      {ctx.after && (
        <div style={{ ...box(50, handleY - 6, 50 + t * 30), opacity: Math.min(1, t * 2.5), transform: `rotate(${(1 - t) * 10 + 25}deg)` }} className="flex items-center">
          <div className="w-full drop-shadow-lg"><Art visual={ctx.after} /></div>
        </div>
      )}
      <div className="absolute inset-x-[6%] h-[7%] rounded-full bg-[#b47740] border-4 border-[#6b4a2f] shadow-lg" style={{ top: `${(handleY / H) * 100}%`, translate: "0 -50%" }} />
    </Stage>
  );
}

// --- stretch: the dough is rolled out wider ----------------------------------------------------

// The flat dough picture is 512 wide with the dough itself 444 wide and 308 tall, centred at (256, 270).
const DOUGH = { rx: 222, cy: 270 };

function Stretch({ ctx, p }: { ctx: Ctx<Of<"stretch">>; p: number }) {
  const { anim } = ctx;
  const r = anim.target * (0.42 + 0.58 * ease(p));
  const width = (r * 512) / DOUGH.rx;
  const pinX = 50 + Math.sin(p * Math.PI * 5) * r * 0.5;
  return (
    <Stage>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={anim.image}
        alt=""
        draggable={false}
        className="absolute drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]"
        style={{ left: `${50 - width / 2}%`, top: `${((CENTRE.y - (DOUGH.cy / 512) * width) / H) * 100}%`, width: `${width}%` }}
      />
      {p < 1 && <div className="absolute w-[50%] aspect-[2/1] bg-[url('/assets/food/italian/icons/rolling-pin.webp')] bg-contain bg-center bg-no-repeat drop-shadow-lg" style={{ ...at(pinX, CENTRE.y), translate: "-50% -50%", rotate: "70deg" }} />}
    </Stage>
  );
}

// --- pound: the pestle crushes every chunk in the mortar -----------------------------------------

function Pound({ ctx, p }: { ctx: Ctx<Of<"pound">>; p: number }) {
  const { anim } = ctx;
  const chunks = useMemo(
    () =>
      Array.from({ length: anim.chunks }, (_, i) => {
        const a = i * 2.4;
        const d = 0.25 + ((i * 37) % 70) / 100;
        return { x: 50 + Math.cos(a) * 20 * d, y: H / 2 + 2 + Math.sin(a) * 11 * d, colour: anim.colors[i % anim.colors.length] };
      }),
    [anim]
  );
  // Each chunk takes two hits, one chunk after another.
  const hits = Math.min(chunks.length * 2, Math.floor(p * chunks.length * 2));
  const target = chunks[Math.min(chunks.length - 1, Math.floor(hits / 2))];
  return (
    <Stage>
      <Food ctx={ctx} />
      {chunks.map((c, i) => {
        const hp = 2 - Math.max(0, Math.min(2, hits - i * 2));
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ ...box(c.x, c.y, hp === 2 ? 8 : hp === 1 ? 5.5 : 7), background: c.colour, border: hp > 0 ? "3px solid #4A2A14" : "none", opacity: hp > 0 ? 1 : 0.55, transform: hp > 0 ? undefined : "scaleY(0.35)" }}
          />
        );
      })}
      {p < 1 && (
        <motion.div
          key={hits}
          className="absolute w-[9%] h-[44%] rounded-full bg-[#d9a066] border-4 border-stone-700 origin-bottom"
          style={{ left: `${target.x - 4.5}%`, top: `${((target.y - 32) / H) * 100}%` }}
          initial={{ y: -16, rotate: 14 }}
          animate={{ y: 0, rotate: 14 }}
          transition={{ duration: 0.07 }}
        />
      )}
    </Stage>
  );
}
