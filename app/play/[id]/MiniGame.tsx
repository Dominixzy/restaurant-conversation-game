"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { StepQuality } from "@/lib/gameplayStore";
import type { MiniGame as Game } from "./Dish";

type Result = { quality: StepQuality; label: string };

const GOOD = (q: StepQuality) => q === "perfect" || q === "ok";

// A short skill check for a cooking step. Calls onDone once the player finishes it.
export default function MiniGame({ game, name, onDone, onCancel }: { game: Game; name: string; onDone: (quality: StepQuality, label: string) => void; onCancel: () => void }) {
  const [result, setResult] = useState<Result | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // Show the outcome for a moment, then hand it back.
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => onDoneRef.current(result.quality, result.label), 900);
    return () => clearTimeout(t);
  }, [result]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.45 }}
        className="relative w-full max-w-md bg-[#fffaf0] rounded-3xl border-4 border-orange-400 shadow-2xl p-5 md:p-6 text-center"
      >
        {!result && (
          <button onClick={onCancel} className="absolute top-2 right-3 text-stone-400 hover:text-stone-600 text-sm font-bold">
            Cancel
          </button>
        )}
        <p className="font-luckiest-guy text-2xl md:text-3xl text-orange-600 tracking-wide">{name}</p>
        <p className="text-sm md:text-base font-bold text-stone-500 mb-4">{game.prompt}</p>

        {game.type === "timing" && <Timing game={game} done={!!result} onResult={setResult} />}
        {game.type === "hold" && <Hold game={game} name={name} done={!!result} onResult={setResult} />}
        {game.type === "slice" && <Slice game={game} done={!!result} onResult={setResult} />}
        {game.type === "pound" && <Pound game={game} done={!!result} onResult={setResult} />}

        {result && (
          <motion.p
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.6 }}
            className={`mt-4 font-luckiest-guy text-3xl tracking-wide ${GOOD(result.quality) ? "text-green-600" : "text-red-600"}`}
          >
            {result.label}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}

// Plays `step(elapsedSeconds)` every frame until it returns false or the component goes away.
function useFrames(step: (elapsed: number) => boolean, running: boolean) {
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (stepRef.current((now - start) / 1000)) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

// A needle sweeps from undercooked to overcooked; stop it in the middle zone.
function Timing({ game, done, onResult }: { game: Extract<Game, { type: "timing" }>; done: boolean; onResult: (r: Result) => void }) {
  const [pos, setPos] = useState(0);
  const zoneAt = (p: number) => game.zones.find((z) => p <= z.to) ?? game.zones[game.zones.length - 1];
  const stop = (p: number) => {
    const zone = zoneAt(p);
    onResult({ quality: zone.quality, label: `${zone.label}${GOOD(zone.quality) ? "!" : "..."}` });
  };

  useFrames((t) => {
    const p = Math.min(100, (t / game.seconds) * 100);
    setPos(p);
    if (p >= 100) stop(100);
    return p < 100;
  }, !done);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!done) stop(pos);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div>
      <div className="relative h-10 rounded-full overflow-hidden border-4 border-stone-700 flex">
        {game.zones.map((z, i) => {
          const width = z.to - (i > 0 ? game.zones[i - 1].to : 0);
          const colour = GOOD(z.quality) ? "bg-green-400" : z.quality === "under" ? "bg-amber-100" : "bg-stone-700";
          return (
            <div key={z.label} className={`${colour} h-full flex items-center justify-center`} style={{ width: `${width}%` }}>
              <span className={`text-[11px] md:text-xs font-black uppercase ${z.quality === "over" ? "text-white" : "text-stone-700"}`}>{z.label}</span>
            </div>
          );
        })}
        <div className="absolute top-[-4px] bottom-[-4px] w-1.5 bg-red-600 rounded shadow" style={{ left: `calc(${pos}% - 3px)` }} />
      </div>
      <button
        disabled={done}
        onClick={() => stop(pos)}
        className="mt-4 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-luckiest-guy text-2xl py-3 rounded-2xl shadow-[0_6px_0_#9a3412] active:translate-y-1 active:shadow-none"
      >
        {game.stop}
      </button>
    </div>
  );
}

// Keep holding the button until the bar fills; letting go early drains it.
function Hold({ game, name, done, onResult }: { game: Extract<Game, { type: "hold" }>; name: string; done: boolean; onResult: (r: Result) => void }) {
  const [held, setHeld] = useState(false);
  const [fill, setFill] = useState(0);
  const last = useRef(0);
  const current = useRef(0);

  useFrames((t) => {
    const dt = t - last.current;
    last.current = t;
    const next = Math.max(0, Math.min(100, current.current + (held ? 1 : -1.5) * (dt / game.seconds) * 100));
    current.current = next;
    setFill(next);
    if (next >= 100) {
      onResult({ quality: "perfect", label: `${name}ed!` });
      return false;
    }
    return true;
  }, !done);

  return (
    <div>
      <div className="h-6 rounded-full bg-stone-200 border-4 border-stone-700 overflow-hidden">
        <div className="h-full bg-green-400" style={{ width: `${fill}%` }} />
      </div>
      <button
        disabled={done}
        onPointerDown={() => setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
        onContextMenu={(e) => e.preventDefault()}
        className={`mt-4 w-full select-none touch-none text-white font-luckiest-guy text-2xl py-3 rounded-2xl shadow-[0_6px_0_#9a3412] disabled:opacity-50 ${held ? "bg-orange-400 translate-y-1 shadow-none" : "bg-orange-500"}`}
      >
        {held ? "Keep holding…" : "Hold"}
      </button>
    </div>
  );
}

// The knife sweeps back and forth; tap when it is over each cut mark.
function Slice({ game, done, onResult }: { game: Extract<Game, { type: "slice" }>; done: boolean; onResult: (r: Result) => void }) {
  const marks = Array.from({ length: game.marks }, (_, i) => ((i + 1) * 100) / (game.marks + 1));
  const [pos, setPos] = useState(0);
  const [cuts, setCuts] = useState<{ at: number; hit: boolean }[]>([]);
  const SWEEP = 1.3; // seconds from one side to the other
  const TOLERANCE = 7;

  useFrames((t) => {
    const phase = (t / SWEEP) % 2;
    setPos((phase < 1 ? phase : 2 - phase) * 100);
    return true;
  }, !done);

  const cut = () => {
    if (done || cuts.length >= marks.length) return;
    const open = marks.filter((m) => !cuts.some((c) => c.hit && Math.abs(c.at - m) <= TOLERANCE));
    const hit = open.some((m) => Math.abs(m - pos) <= TOLERANCE);
    const next = [...cuts, { at: pos, hit }];
    setCuts(next);
    if (next.length === marks.length) {
      const hits = next.filter((c) => c.hit).length;
      onResult(
        hits === marks.length ? { quality: "perfect", label: "Clean cuts!" }
        : hits === marks.length - 1 ? { quality: "ok", label: "Not bad!" }
        : { quality: "bad", label: "Uneven..." }
      );
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        cut();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div>
      <div className="relative h-16 rounded-2xl bg-[#e2b07a] border-4 border-stone-700 overflow-hidden">
        {marks.map((m) => (
          <div key={m} className="absolute top-2 bottom-2 w-1 border-l-4 border-dashed border-stone-700/60" style={{ left: `${m}%` }} />
        ))}
        {cuts.map((c, i) => (
          <div key={i} className={`absolute top-0 bottom-0 w-1 ${c.hit ? "bg-green-600" : "bg-red-600"}`} style={{ left: `${c.at}%` }} />
        ))}
        <div
          className="absolute -top-1 w-10 h-12"
          style={{ left: `calc(${pos}% - 20px)`, backgroundImage: "url('/assets/food/sushi/2.png')", backgroundSize: "300% 200%", backgroundPosition: "0% 0%", rotate: "60deg" }}
        />
      </div>
      <p className="mt-2 text-xs font-bold text-stone-500">{cuts.length} / {marks.length} cuts</p>
      <button
        disabled={done}
        onClick={cut}
        className="mt-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-luckiest-guy text-2xl py-3 rounded-2xl shadow-[0_6px_0_#9a3412] active:translate-y-1 active:shadow-none"
      >
        Slice!
      </button>
    </div>
  );
}

// Tap as fast as you can until the paste is ready; slow pounding makes a coarse paste.
function Pound({ game, done, onResult }: { game: Extract<Game, { type: "pound" }>; done: boolean; onResult: (r: Result) => void }) {
  const [taps, setTaps] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [hit, setHit] = useState(0); // bumps on every tap to replay the pestle animation
  const LIMIT = game.seconds * 2;

  useFrames((t) => {
    setElapsed(t);
    if (t >= LIMIT) {
      onResult({ quality: "bad", label: "Too slow..." });
      return false;
    }
    return true;
  }, !done);

  const tap = () => {
    if (done) return;
    const next = taps + 1;
    setTaps(next);
    setHit((h) => h + 1);
    if (next >= game.taps) {
      onResult(elapsed <= game.seconds ? { quality: "perfect", label: "Smooth paste!" } : { quality: "ok", label: "Done!" });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const timeLeft = Math.max(0, game.seconds - elapsed);
  return (
    <div>
      <div className="relative h-24 flex items-end justify-center">
        <div className="w-32 h-14 rounded-b-full bg-[#b8642e] border-4 border-stone-700" />
        <motion.div
          key={hit}
          className="absolute bottom-6 w-6 h-20 rounded-full bg-[#d9a066] border-4 border-stone-700 origin-bottom"
          initial={{ y: -18, rotate: 12 }}
          animate={{ y: 0, rotate: 12 }}
          transition={{ duration: 0.08 }}
        />
      </div>
      <div className="mt-3 h-6 rounded-full bg-stone-200 border-4 border-stone-700 overflow-hidden">
        <div className="h-full bg-green-400 transition-[width] duration-75" style={{ width: `${(taps / game.taps) * 100}%` }} />
      </div>
      <p className={`mt-2 text-xs font-bold ${timeLeft > 0 ? "text-stone-500" : "text-red-500"}`}>
        {timeLeft > 0 ? `${timeLeft.toFixed(1)}s left for a smooth paste` : "Keep going!"}
      </p>
      <button
        disabled={done}
        onClick={tap}
        className="mt-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-luckiest-guy text-2xl py-3 rounded-2xl shadow-[0_6px_0_#9a3412] active:translate-y-1 active:shadow-none select-none touch-manipulation"
      >
        Pound!
      </button>
    </div>
  );
}
