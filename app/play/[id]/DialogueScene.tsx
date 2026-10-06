"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ScrollText, X, Lightbulb, ChevronRight } from "lucide-react";
import { MOOD_HAPPY, MOOD_OK } from "@/lib/gameplayStore";

export interface DialogueChoice {
  text: string;
  next: string;
  moodChange: number;
  tip?: string;
  action?: string;
  recipeId?: string;
}

export interface DialogueNode {
  text: string;
  choices?: DialogueChoice[];
  vocab?: { word: string; meaning: string }[];
  action?: string;
  recipeId?: string;
}

export interface Customer {
  name: string;
  spriteColumn: number; // column in /assets/food/sushi/4.webp (0 = chef)
  gender?: "male" | "female";
  dialogue?: string; // dialogue tree id in dialogues.json (defaults to the restaurant id)
}

type Expression = "happy" | "neutral" | "upset";
type LogEntry = { speaker: "customer" | "chef"; text: string };

interface DialogueSceneProps {
  nodeId: string;
  node: DialogueNode;
  customer: Customer;
  customerMood: number;
  background?: string; // dining room picture; the sushi bar when not given
  onChoose: (choice: DialogueChoice) => void;
  onFinish: () => void;
}

const TYPE_SPEED_MS = 28;
const CHEF_COLUMN = 0;

// 4.png is a 4x3 sheet: columns are characters, rows are happy / neutral / upset.
function spriteStyle(column: number, expression: Expression): React.CSSProperties {
  const row = expression === "happy" ? 0 : expression === "neutral" ? 1 : 2;
  return {
    backgroundImage: "url('/assets/food/sushi/4.webp')",
    backgroundSize: "400% 300%",
    backgroundPosition: `${column * 33.333}% ${row * 50}%`,
    backgroundRepeat: "no-repeat",
  };
}

function moodToExpression(mood: number): Expression {
  if (mood >= MOOD_HAPPY) return "happy";
  if (mood >= MOOD_OK) return "neutral";
  return "upset";
}

// Deterministic shuffle so the best answer isn't always first, without re-shuffling on re-render.
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) | 0;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Voice names that hint at gender across macOS, Windows and Chrome.
const MALE_VOICES = /\b(male|daniel|alex|fred|aaron|arthur|gordon|rishi|tom|oliver|david|mark|guy|james|george|ryan)\b/i;
const FEMALE_VOICES = /\b(female|samantha|karen|moira|tessa|victoria|fiona|serena|martha|nicky|kate|susan|zira|aria|jenny|libby|sonia|hazel)\b/i;

function pickVoice(gender: "male" | "female", variant: number) {
  const english = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const wanted = english.filter((v) => (gender === "male" ? MALE_VOICES : FEMALE_VOICES).test(v.name) && !(gender === "male" ? /female/i : /\bmale\b/i).test(v.name));
  const pool = wanted.length ? wanted : english;
  return pool.length ? pool[variant % pool.length] : null;
}

function speak(text: string, who: "customer" | "chef", customer: Customer) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const gender = who === "chef" ? "male" : customer.gender ?? "female";
  const voice = pickVoice(gender, who === "chef" ? 1 : 0);
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.92; // slightly slower for learners
  // If no gendered voice exists, nudge pitch so male and female characters still sound different.
  const matched = voice && (gender === "male" ? MALE_VOICES : FEMALE_VOICES).test(voice.name);
  utter.pitch = matched ? 1 : gender === "male" ? 0.75 : 1.25;
  if (voice) utter.voice = voice;
  synth.speak(utter);
}

function feedbackStyle(moodChange: number) {
  if (moodChange > 0) return { label: "Polite!", box: "bg-green-50 border-green-300", text: "text-green-700", badge: "bg-green-500" };
  if (moodChange === 0) return { label: "Okay", box: "bg-amber-50 border-amber-300", text: "text-amber-700", badge: "bg-amber-500" };
  return { label: "Could be better", box: "bg-red-50 border-red-300", text: "text-red-700", badge: "bg-red-500" };
}

export default function DialogueScene({ nodeId, node, customer, customerMood, background = "/assets/food/sushi/5.webp", onChoose, onFinish }: DialogueSceneProps) {
  const [typed, setTyped] = useState({ nodeId: "", count: 0 });
  const [picked, setPicked] = useState<{ nodeId: string; choice: DialogueChoice } | null>(null);
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  const typedCount = typed.nodeId === nodeId ? typed.count : 0;
  const isTyping = typedCount < node.text.length;
  const activePick = picked?.nodeId === nodeId ? picked.choice : null;
  const choices = useMemo(() => seededShuffle(node.choices ?? [], nodeId + node.text), [node, nodeId]);

  // Preview the mood change immediately so faces react as soon as the player answers.
  const previewMood = activePick ? Math.min(100, Math.max(0, customerMood + activePick.moodChange * 25)) : customerMood;
  const customerExpression = moodToExpression(previewMood);
  const chefExpression: Expression = activePick && activePick.moodChange > 0 ? "happy" : "neutral";

  // Typewriter
  useEffect(() => {
    if (typedCount >= node.text.length) return;
    const t = setTimeout(() => setTyped({ nodeId, count: typedCount + 1 }), TYPE_SPEED_MS);
    return () => clearTimeout(t);
  }, [nodeId, node.text, typedCount]);

  // Read each new customer line aloud
  useEffect(() => {
    if (voiceOn) speak(node.text, "customer", customer);
  }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const skipTyping = () => setTyped({ nodeId, count: node.text.length });

  const pick = (choice: DialogueChoice) => {
    if (activePick) return;
    if (isTyping) skipTyping();
    setPicked({ nodeId, choice });
    setOpenWord(null);
    setLog((l) => [...l, { speaker: "customer", text: node.text }, { speaker: "chef", text: choice.text }]);
    if (voiceOn) speak(choice.text, "chef", customer);
  };

  const advance = () => {
    if (activePick) onChoose(activePick);
  };

  // Keyboard: 1-9 to answer, Enter/Space to skip text or continue
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isTyping) skipTyping();
        else if (activePick) advance();
        else if (choices.length === 0) onFinish();
        return;
      }
      const n = Number(e.key);
      if (!isTyping && !activePick && n >= 1 && n <= choices.length) pick(choices[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const renderLine = () => {
    if (isTyping || !node.vocab?.length) {
      return (
        <>
          {node.text.slice(0, typedCount)}
          {isTyping && <span className="inline-block w-[2px] h-6 bg-orange-500 ml-1 align-middle animate-pulse" />}
        </>
      );
    }
    const pattern = new RegExp(`(${node.vocab.map((v) => v.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return node.text.split(pattern).map((part, i) => {
      const entry = node.vocab!.find((v) => v.word.toLowerCase() === part.toLowerCase());
      if (!entry) return <span key={i}>{part}</span>;
      const open = openWord === entry.word;
      return (
        <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setOpenWord(open ? null : entry.word); }}
            className={`font-bold underline decoration-dotted decoration-2 underline-offset-4 rounded px-0.5 transition-colors ${open ? "bg-orange-500 text-white" : "text-orange-600 hover:text-orange-700"}`}
          >
            {part}
          </button>
      );
    });
  };

  const openEntry = node.vocab?.find((v) => v.word === openWord) ?? null;
  const fb = activePick ? feedbackStyle(activePick.moodChange) : null;
  const delta = activePick ? activePick.moodChange * 25 : 0;

  return (
    <div className="flex flex-col h-screen pt-20 relative overflow-hidden bg-stone-900" onClick={() => setOpenWord(null)}>
      {/* Restaurant interior with warm, flickering lantern light */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${background}')` }} />
      <motion.div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light"
        style={{ background: "radial-gradient(circle at 12% 12%, rgba(255,160,80,0.7), transparent 25%), radial-gradient(circle at 88% 12%, rgba(255,160,80,0.7), transparent 25%), radial-gradient(circle at 50% 30%, rgba(255,200,120,0.4), transparent 40%)" }}
        animate={{ opacity: [0.7, 1, 0.8, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]" />

      {/* Characters */}
      <div className="flex-1 flex items-end justify-between z-10 px-4 md:px-12 min-h-0 max-w-5xl mx-auto w-full translate-y-6 md:translate-y-10">
        {/* Chef (player) */}
        <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="relative aspect-[3/4] h-full max-h-[30vh] md:max-h-[40vh] shrink-0">
          <AnimatePresence>
            {activePick && (
              <motion.div
                key={nodeId}
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[12%] left-[75%] w-56 md:w-72 bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-xl text-sm md:text-base font-bold text-stone-700 z-20"
              >
                {activePick.text}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className="w-full h-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)] scale-x-[-1]" style={spriteStyle(CHEF_COLUMN, chefExpression)} />
          </motion.div>
          <span className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 bg-orange-500 text-white font-luckiest-guy tracking-wider text-sm md:text-base px-4 py-1 rounded-full border-2 border-white shadow-lg whitespace-nowrap">You · Chef</span>
        </motion.div>

        {/* Customer */}
        <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="relative aspect-[3/4] h-full max-h-[30vh] md:max-h-[40vh] shrink-0">
          {/* Reaction bubble + mood change */}
          <AnimatePresence>
            {activePick && activePick.moodChange !== 0 && (
              <motion.div
                key={nodeId}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: "spring", bounce: 0.6 }}
                className="absolute -top-6 right-1 md:-right-8 w-20 h-20 md:w-24 md:h-24 z-20"
                style={{
                  backgroundImage: "url('/assets/food/sushi/7.webp')",
                  backgroundSize: "400% 200%",
                  backgroundPosition: activePick.moodChange > 0 ? "0% 100%" : "33.333% 100%",
                }}
              />
            )}
            {activePick && delta !== 0 && (
              <motion.div
                key={`${nodeId}-delta`}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 1, 0], y: -60 }}
                transition={{ duration: 1.6 }}
                className={`absolute top-8 left-0 font-luckiest-guy text-3xl drop-shadow-[0_2px_0_rgba(0,0,0,0.6)] z-20 ${delta > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {delta > 0 ? `+${delta}` : delta} ♥
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className="w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]"
            style={spriteStyle(customer.spriteColumn, customerExpression)}
            animate={
              activePick && activePick.moodChange < 0
                ? { x: [0, -10, 10, -8, 8, 0] }
                : activePick && activePick.moodChange > 0
                ? { y: [0, -18, 0] }
                : { y: [0, -4, 0] }
            }
            transition={activePick ? { duration: 0.5 } : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 bg-stone-800 text-white font-luckiest-guy tracking-wider text-sm md:text-base px-4 py-1 rounded-full border-2 border-white shadow-lg whitespace-nowrap">{customer.name}</span>
        </motion.div>
      </div>

      {/* Dialogue box */}
      <div
        className="bg-white/95 backdrop-blur-xl border-t-8 border-orange-400 rounded-t-[3rem] p-6 md:p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] z-20 flex flex-col max-h-[58vh] shrink-0 mx-4 md:mx-auto md:w-full md:max-w-4xl rounded-b-none md:rounded-3xl md:mb-6"
        onClick={() => isTyping && skipTyping()}
      >
        <div className="overflow-y-auto overflow-x-visible pr-2 custom-scrollbar flex flex-col h-full">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-2xl md:text-3xl font-luckiest-guy text-orange-600 tracking-wide">{customer.name}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); speak(node.text, "customer", customer); }}
                className="flex items-center gap-1.5 text-xs md:text-sm font-black uppercase tracking-widest text-orange-600 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-full transition-colors"
              >
                <Volume2 size={16} /> Listen
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setVoiceOn((v) => { if (v) window.speechSynthesis?.cancel(); return !v; }); }}
                className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
                title={voiceOn ? "Turn auto voice off" : "Turn auto voice on"}
              >
                {voiceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowLog(true); }}
                className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
                title="Conversation log"
              >
                <ScrollText size={18} />
              </button>
            </div>
          </div>
          <p className="text-lg md:text-2xl font-sans font-medium text-stone-700 leading-relaxed mb-2 shrink-0 min-h-[3.5rem] pt-1">
            &ldquo;{renderLine()}&rdquo;
          </p>
          <AnimatePresence>
            {openEntry && (
              <motion.div
                key={openEntry.word}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden shrink-0"
              >
                <div className="bg-stone-800 text-white rounded-xl px-4 py-3 mb-3 text-sm md:text-base font-medium leading-snug">
                  <span className="text-orange-300 font-black uppercase text-xs tracking-widest mr-2">{openEntry.word}</span>
                  {openEntry.meaning}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!isTyping && !!node.vocab?.length && !activePick && !openEntry && (
            <p className="text-xs md:text-sm text-stone-400 font-semibold mb-4">Tap the <span className="text-orange-600 underline decoration-dotted">orange words</span> to see what they mean.</p>
          )}

          <div className="flex flex-col gap-3 mt-auto pb-2 pt-2">
            <AnimatePresence mode="wait">
              {isTyping ? (
                <motion.p key="wait" exit={{ opacity: 0 }} className="text-center text-stone-400 text-sm font-semibold">Tap to skip ▸</motion.p>
              ) : activePick && fb ? (
                <motion.div key="feedback" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                  <div className={`border-2 rounded-2xl p-4 md:p-5 ${fb.box}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${fb.badge}`}>{fb.label}</span>
                      <span className={`flex items-center gap-1 text-xs font-black uppercase tracking-widest ${fb.text}`}><Lightbulb size={14} /> Language tip</span>
                    </div>
                    <p className={`text-sm md:text-lg font-semibold leading-relaxed ${fb.text}`}>
                      {activePick.tip ?? (activePick.moodChange > 0 ? "Nice, polite answer!" : "Try to sound more polite and helpful.")}
                    </p>
                  </div>
                  <button
                    onClick={advance}
                    className="self-end flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-luckiest-guy text-xl tracking-widest px-8 py-3 rounded-2xl shadow-[0_6px_0_#9a3412] hover:shadow-[0_3px_0_#9a3412] hover:translate-y-[3px] transition-all"
                  >
                    Continue <ChevronRight size={22} strokeWidth={3} />
                  </button>
                </motion.div>
              ) : choices.length > 0 ? (
                <motion.div key="choices" className="flex flex-col gap-3">
                  <p className="text-xs font-black uppercase tracking-widest text-stone-400">How do you reply?</p>
                  {choices.map((choice, idx) => (
                    <motion.button
                      key={choice.text}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      onClick={() => pick(choice)}
                      className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-400 text-left px-5 py-4 rounded-2xl transition-colors hover:shadow-lg font-bold text-stone-700 hover:text-orange-900 text-base md:text-xl flex items-center gap-4 group"
                    >
                      <span className="shrink-0 w-8 h-8 rounded-lg bg-white border-2 border-orange-200 group-hover:border-orange-400 text-orange-500 text-sm font-black flex items-center justify-center">{idx + 1}</span>
                      <span>{choice.text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <motion.button
                  key="finish"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={onFinish}
                  className="bg-orange-500 hover:bg-orange-600 border-2 border-orange-600 text-center text-white px-6 py-5 rounded-2xl transition-all duration-200 hover:scale-[1.01] shadow-xl font-luckiest-guy text-2xl tracking-widest uppercase"
                >
                  {node.action === "start_cooking" ? "Go to Kitchen 👨‍🍳" : "Continue"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Conversation log */}
      <AnimatePresence>
        {showLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-end" onClick={() => setShowLog(false)}>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-md h-full bg-[#FFF8E7] p-6 overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-luckiest-guy text-3xl text-orange-600 tracking-wide">Conversation</h3>
                <button onClick={() => setShowLog(false)} className="p-2 rounded-full hover:bg-orange-100 text-stone-500"><X size={24} /></button>
              </div>
              <div className="flex flex-col gap-3">
                {[...log, { speaker: "customer" as const, text: node.text }].map((entry, i) => (
                  <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-3 ${entry.speaker === "chef" ? "self-end bg-orange-500 text-white rounded-br-none" : "self-start bg-white text-stone-700 rounded-bl-none shadow"}`}>
                    <span className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${entry.speaker === "chef" ? "text-orange-100" : "text-stone-400"}`}>
                      {entry.speaker === "chef" ? "You" : customer.name}
                    </span>
                    <span className="font-semibold">{entry.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
