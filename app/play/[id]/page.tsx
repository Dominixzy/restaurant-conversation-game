"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameplayStore, MOOD_HAPPY, MOOD_OK } from "@/lib/gameplayStore";
import { useGameStore } from "@/lib/store";
import restaurantsData from "@/data/restaurants.json";
import dialoguesData from "@/data/dialogues.json";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { Star, ArrowLeft, Trash2, Check, Undo2, X } from "lucide-react";
import { PlateStack, DishPreview } from "./Dish";
import DialogueScene, { type Customer, type DialogueChoice } from "./DialogueScene";

// What the customer says while watching you cook, based on the latest step.
const GOOD_LINES = ["Looks good!", "Nice!", "Mm, I can't wait!"];
function customerReaction(steps: string[], sequence: string[], complete: boolean) {
  if (steps.length === 0) return null;
  const key = steps.length;
  if (complete) return { key, tone: "good", text: "Wow, that looks delicious!" };
  const last = steps.length - 1;
  if (steps[last] !== sequence[last]) return { key, tone: "bad", text: "Hmm? I don't think that's right." };
  return { key, tone: "good", text: GOOD_LINES[last % GOOD_LINES.length] };
}

export default function PlayScreen() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  
  const restaurant = restaurantsData.find(r => r.id === restaurantId);
  const dialogueTree = (dialoguesData as any)[restaurantId];
  const { 
    phase, currentNodeId, customerMood, score, assembledIngredients, currentRecipeId,
    startGame, makeChoice, addIngredient, removeLastIngredient, clearIngredients, serveFood, resetGame 
  } = useGameplayStore();

  const recipe = currentRecipeId ? (recipesData as any)[currentRecipeId] : null;

  const { completeLevel } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [added, setAdded] = useState<{ key: number; verb: string; name: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (restaurant) {
      startGame(restaurantId);
    }
    return () => resetGame();
  }, [restaurantId]);

  if (!mounted || !restaurant) return null;

  const currentDialogue = dialogueTree ? dialogueTree[currentNodeId] : null;

  // --- ACTIONS ---
  const handleChoice = (choice: DialogueChoice) => {
    makeChoice(choice.next, choice.moodChange, currentDialogue.action || choice.action, currentDialogue.recipeId || choice.recipeId);
  };

  const handleServe = () => {
    if (!recipe) return;
    const isCorrect = JSON.stringify(assembledIngredients) === JSON.stringify(recipe.correctSequence);
    serveFood(isCorrect);
  };

  const handleFinish = () => {
    if (score > 0) {
      completeLevel(restaurantId, score);
    }
    router.push("/select");
  };

  // --- RENDERERS ---
  const renderHUD = () => (
    <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between gap-3 px-4 md:px-6 z-50 pointer-events-none">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 pointer-events-auto">
        <button onClick={() => router.push("/select")} className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors text-white shrink-0">
          <ArrowLeft size={24} />
        </button>
        <div className="min-w-0">
          <h2 className="font-luckiest-guy text-lg md:text-2xl text-white tracking-wider drop-shadow-md truncate">{restaurant.name}</h2>
          <p className="text-xs font-black tracking-widest text-orange-300 uppercase drop-shadow-md">Phase: {phase}</p>
        </div>
      </div>
      
      {/* Mood Bar utilizing 7.png icons */}
      <div className="flex items-center gap-3 bg-black/30 px-3 md:px-4 py-2 rounded-full border border-white/20 shrink-0 pointer-events-auto">
        <div className={`w-8 h-8 ${customerMood >= MOOD_OK ? "bg-[url('/assets/food/sushi/7.png')] bg-[length:400%_200%] bg-[position:0%_100%]" : "bg-[url('/assets/food/sushi/7.png')] bg-[length:400%_200%] bg-[position:33.33%_100%]"} scale-125`} />
        <div className="w-20 md:w-32 h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
          <motion.div 
            className={`h-full ${customerMood >= MOOD_HAPPY ? 'bg-green-400' : customerMood >= MOOD_OK ? 'bg-yellow-400' : 'bg-red-400'}`}
            initial={{ width: "50%" }}
            animate={{ width: `${customerMood}%` }}
          />
        </div>
      </div>
    </div>
  );

  const renderDialogue = () => {
    if (!currentDialogue) return <div className="mt-32 text-center">Dialogue missing for this level!</div>;

    return (
      <DialogueScene
        nodeId={currentNodeId}
        node={currentDialogue}
        customer={(restaurant as { customer?: Customer }).customer ?? { name: "Customer", spriteColumn: 2 }}
        customerMood={customerMood}
        onChoose={handleChoice}
        onFinish={() => makeChoice("", 0, currentDialogue.action, currentDialogue.recipeId)}
      />
    );
  };

  const renderCooking = () => {
    if (!recipe) return null;
    const customerColumn = (restaurant as { customer?: Customer }).customer?.spriteColumn ?? 2;
    const extras: string[] = assembledIngredients.slice(recipe.correctSequence.length);
    const tools = ingredientsData.filter((i) => "action" in i && i.action);
    const foods = ingredientsData.filter((i) => !("action" in i && i.action));
    const isComplete = JSON.stringify(assembledIngredients) === JSON.stringify(recipe.correctSequence);
    const reaction = customerReaction(assembledIngredients, recipe.correctSequence, isComplete);

    return (
      <div className="flex flex-col h-screen relative overflow-hidden bg-stone-900">
        {/* Across the counter: the dining room, with the customer seated behind the counter's edge */}
        <div className="relative h-[30vh] md:h-[34vh] shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/assets/food/sushi/5.png')] bg-cover bg-no-repeat" style={{ backgroundPosition: "center 28%" }} />
          <motion.div
            className="absolute inset-0 pointer-events-none mix-blend-soft-light"
            style={{ background: "radial-gradient(circle at 15% 20%, rgba(255,160,80,0.7), transparent 30%), radial-gradient(circle at 85% 20%, rgba(255,160,80,0.7), transparent 30%)" }}
            animate={{ opacity: [0.7, 1, 0.8, 1, 0.7] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/25" />

          {/* Warm spotlight that draws the eye to the customer */}
          <div className="absolute bottom-0 right-[-6%] md:right-auto md:left-1/2 md:-translate-x-1/2 h-full aspect-square rounded-full bg-[radial-gradient(circle_at_50%_60%,rgba(255,214,150,0.55),transparent_62%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.45)_100%)] pointer-events-none" />

          {/* Customer watching you cook */}
          <div className="absolute bottom-0 right-[2%] md:right-auto md:left-1/2 md:-translate-x-1/2 h-[98%] aspect-[3/4] translate-y-[16%] z-10">
            <motion.div
              key={reaction ? reaction.key : "idle"}
              className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.4)]"
              style={{
                backgroundImage: "url('/assets/food/sushi/4.png')",
                backgroundSize: "400% 300%",
                backgroundPosition: `${customerColumn * 33.333}% ${reaction?.tone === "bad" ? 100 : customerMood >= MOOD_HAPPY ? 0 : customerMood >= MOOD_OK ? 50 : 100}%`,
                backgroundRepeat: "no-repeat"
              }}
              animate={reaction?.tone === "bad" ? { x: [0, -8, 8, -6, 6, 0] } : reaction ? { y: [0, -14, 0] } : { y: [0, -3, 0] }}
              transition={reaction ? { duration: 0.5 } : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          {/* What the customer says about each step */}
          <AnimatePresence>
            {reaction && (
              <motion.div
                key={reaction.key}
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`absolute top-[40%] right-[36%] md:right-auto md:left-[calc(50%+11vh)] max-w-[44%] md:max-w-xs bg-white rounded-2xl rounded-br-none md:rounded-br-2xl md:rounded-bl-none px-3 py-2 md:px-4 md:py-3 shadow-xl text-xs md:text-base font-bold z-30 ${reaction.tone === "bad" ? "text-red-600" : "text-stone-700"}`}
              >
                {reaction.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Front edge of the sushi bar */}
          <div className="absolute bottom-0 inset-x-0 h-4 md:h-6 bg-gradient-to-b from-[#e2a867] via-[#c4834a] to-[#8a5528] border-t-2 border-[#f3c58c] z-20" />
        </div>

        {/* Prep counter, seen from above */}
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0 bg-[url('/assets/food/sushi/6.png')] bg-cover bg-center bg-no-repeat" />
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />

          {/* Undo / Discard / Serve, at the right edge of the counter */}
          <div className="absolute inset-x-0 bottom-[170px] md:inset-x-auto md:bottom-auto md:right-10 md:top-6 flex flex-row md:flex-col justify-center gap-3 md:gap-4 z-40 pointer-events-none [&>button]:pointer-events-auto">
            <button
              onClick={removeLastIngredient}
              disabled={assembledIngredients.length === 0}
              className="w-12 h-12 md:w-20 md:h-20 bg-stone-100 hover:bg-white border-4 border-stone-300 hover:border-orange-400 rounded-2xl flex items-center justify-center text-stone-500 hover:text-orange-500 transition-all hover:scale-110 shadow-lg group relative disabled:opacity-40 disabled:pointer-events-none"
            >
              <Undo2 size={28} className="md:w-8 md:h-8" />
              <span className="absolute right-full mr-4 bg-black/80 text-white font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider text-sm whitespace-nowrap">Undo</span>
            </button>
            <button
              onClick={clearIngredients}
              className="w-12 h-12 md:w-20 md:h-20 bg-stone-100 hover:bg-white border-4 border-stone-300 hover:border-red-400 rounded-2xl flex items-center justify-center text-stone-500 hover:text-red-500 transition-all hover:scale-110 shadow-lg group relative"
            >
              <Trash2 size={28} className="md:w-8 md:h-8" />
              <span className="absolute right-full mr-4 bg-black/80 text-white font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider text-sm whitespace-nowrap">Discard</span>
            </button>
            <button
              onClick={handleServe}
              className="w-12 h-12 md:w-24 md:h-24 bg-orange-500 hover:bg-orange-400 border-4 border-orange-600 hover:border-orange-300 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-110 shadow-[0_8px_0_#9a3412] hover:shadow-[0_4px_0_#9a3412] hover:translate-y-1 active:shadow-none active:translate-y-2 group relative"
            >
              <Check size={40} strokeWidth={4} />
              <span className="absolute right-full mr-4 bg-orange-600 text-white font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider text-sm whitespace-nowrap">Serve!</span>
            </button>
          </div>


          {/* Center Area: Bamboo Mat + Plate */}
          <div className="absolute inset-x-0 top-2 bottom-[232px] md:bottom-[168px] flex items-center justify-center pointer-events-none">
          <div className="relative h-full max-h-[min(480px,90vw)] aspect-square flex items-center justify-center">
            {/* Bamboo Mat */}
            <div 
              className="absolute w-full h-full z-0 drop-shadow-2xl"
              style={{ backgroundImage: "url('/assets/food/sushi/8.png')", backgroundSize: "300% 200%", backgroundPosition: "0% 100%" }}
            />
            
            {/* The Plate */}
            <div 
              className="relative w-[110%] h-[110%] z-10 drop-shadow-2xl flex items-center justify-center -translate-y-4"
              style={{ backgroundImage: "url('/assets/food/sushi/8.png')", backgroundSize: "300% 200%", backgroundPosition: "50% 100%", backgroundRepeat: "no-repeat" }}
            >
              {/* Ingredients stack in the order they were added; a matching plate becomes the finished dish */}
              <div className="absolute inset-0 -translate-y-[11%]">
                <PlateStack ids={assembledIngredients} final={recipe.final} complete={isComplete} />
                {/* Name of what was just added floats up, so hidden layers (like wasabi under fish) still register */}
                {added && (
                  <motion.div
                    key={added.key}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -50 }}
                    transition={{ duration: 1.2 }}
                    className="absolute left-1/2 top-[18%] -translate-x-1/2 z-50 whitespace-nowrap font-luckiest-guy text-xl md:text-2xl text-white tracking-wider drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]"
                  >
                    {added.verb} {added.name}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Top UI Bar (Custom for Cooking Phase) */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent flex items-start justify-between gap-3 px-3 pt-3 md:px-6 md:pt-6 z-50 pointer-events-none">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button 
              onClick={() => router.push("/select")}
              className="p-2 md:p-3 shrink-0 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white pointer-events-auto backdrop-blur-md border border-white/20 shadow-lg"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="min-w-0">
              <h2 className="font-luckiest-guy text-lg md:text-3xl text-white tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] truncate">{restaurant.name}</h2>
              <p className="text-[10px] md:text-sm whitespace-nowrap font-black tracking-widest text-orange-400 uppercase drop-shadow-md">Phase: Cooking</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 shrink-0 bg-black/40 backdrop-blur-md pl-1 md:pl-2 pr-3 md:pr-6 py-1 md:py-2 rounded-full border border-white/20 shadow-xl pointer-events-auto">
            <div 
              className="w-9 h-9 md:w-12 md:h-12 drop-shadow-md"
              style={{
                backgroundImage: "url('/assets/food/sushi/7.png')",
                backgroundSize: "400% 200%",
                backgroundPosition: customerMood >= MOOD_OK ? "0% 100%" : "33.33% 100%",
                backgroundRepeat: "no-repeat"
              }}
            />
            <div className="w-20 md:w-40 h-4 md:h-5 bg-black/60 rounded-full overflow-hidden border-2 border-stone-600 shadow-inner">
              <div 
                className={`h-full transition-all duration-500 ${customerMood >= MOOD_HAPPY ? 'bg-green-500' : customerMood >= MOOD_OK ? 'bg-yellow-400' : 'bg-red-500'}`}
                style={{ width: `${customerMood}%` }}
              />
            </div>
          </div>
        </div>

        {/* Order ticket clipped to the ticket rail */}
        <div className="absolute top-[68px] md:top-[100px] left-0 w-[62%] md:w-[34%] h-1.5 bg-gradient-to-b from-stone-300 to-stone-500 rounded-r-full shadow-md z-40" />
        <motion.div
          initial={{ rotate: -12, y: -20, opacity: 0 }}
          animate={{ rotate: -2, y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          style={{ transformOrigin: "50% 0%" }}
          className="absolute top-[64px] md:top-[96px] left-3 md:left-8 w-[56%] md:w-auto md:min-w-[240px] bg-[#fffdf7] px-3 pt-4 pb-2 md:px-6 md:pt-6 md:pb-4 rounded-b-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-l-8 border-orange-500 z-40 flex flex-col"
        >
           <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-stone-700 rounded-sm shadow" />
           <div className="flex items-center gap-2 mb-1 md:mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
             <h3 className="font-luckiest-guy text-[10px] md:text-sm text-stone-400 tracking-wider uppercase">Order Ticket</h3>
           </div>
           <p className="font-black text-sm md:text-2xl leading-tight text-stone-800 border-b-2 border-dashed border-stone-200 pb-1 mb-1 md:pb-2 md:mb-2">{recipe.targetDishName}</p>

           {/* Steps: chips on phones, a checklist on larger screens */}
           <div className="flex flex-wrap md:flex-col gap-1">
             {recipe.correctSequence.map((ingId: string, idx: number) => {
               const ing = ingredientsData.find((i) => i.id === ingId);
               const placed = assembledIngredients[idx];
               const isDone = placed === ingId;
               const isWrong = placed !== undefined && !isDone;
               return (
                 <div key={idx} className={`flex items-center gap-1 md:gap-2 rounded-full md:rounded-none px-1.5 py-0.5 md:p-0 ${isDone ? 'bg-green-50 md:bg-transparent' : isWrong ? 'bg-red-50 md:bg-transparent' : 'bg-stone-100 md:bg-transparent'}`}>
                   <div className={`w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 rounded-full border-2 flex items-center justify-center ${isDone ? 'bg-green-500 border-green-600' : isWrong ? 'bg-red-500 border-red-600' : 'border-stone-300'}`}>
                     {isDone && <Check size={10} className="text-white" strokeWidth={4} />}
                     {isWrong && <X size={10} className="text-white" strokeWidth={4} />}
                   </div>
                   <span className={`text-[10px] md:text-sm font-bold whitespace-nowrap ${isDone ? 'text-stone-400 line-through' : isWrong ? 'text-red-600' : 'text-stone-700'}`}>
                     {ing?.name || ingId}
                   </span>
                 </div>
               );
             })}
             {extras.map((ingId, idx) => (
               <div key={`extra-${idx}`} className="flex items-center gap-1 md:gap-2 rounded-full md:rounded-none px-1.5 py-0.5 md:p-0 bg-red-50 md:bg-transparent">
                 <div className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 rounded-full border-2 bg-red-500 border-red-600 flex items-center justify-center">
                   <X size={10} className="text-white" strokeWidth={4} />
                 </div>
                 <span className="text-[10px] md:text-sm font-bold whitespace-nowrap text-red-600">Extra: {ingredientsData.find((i) => i.id === ingId)?.name || ingId}</span>
               </div>
             ))}
           </div>
        </motion.div>

        {/* Ingredients Bar (Bottom) - Now shows ALL possible ingredients! */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-stone-900/80 backdrop-blur-md border-t border-white/10 px-4 md:px-8 py-6 z-30 flex items-center gap-4 md:gap-6 overflow-x-auto custom-scrollbar">
          {[tools, foods].map((group, g) => (
            <div key={g} className={`flex items-center gap-4 md:gap-6 shrink-0 ${g === 0 ? "pr-4 md:pr-6 border-r-2 border-white/20" : ""}`}>
              {group.map((ing) => (
                <button
                  key={ing.id}
                  onClick={() => {
                    addIngredient(ing.id);
                    setAdded({ key: Date.now(), verb: ing.action ? "" : "+", name: ing.name });
                  }}
                  className="group relative flex flex-col items-center gap-2 shrink-0 pointer-events-auto"
                >
                  {/* Bin Design resembling wooden blocks matching UI style; tools get a darker block */}
                  <div className={`w-16 h-16 md:w-20 md:h-20 border-4 rounded-2xl group-hover:translate-y-1 transition-all overflow-hidden flex items-center justify-center group-active:shadow-none group-active:translate-y-2 ${ing.action ? "bg-[#3b2a1e] border-[#6b4a2f] shadow-[0_6px_0_#24170f] group-hover:shadow-[0_2px_0_#24170f]" : "bg-[#f8f0e3] border-[#d4bca3] shadow-[0_6px_0_#b59a7f] group-hover:shadow-[0_2px_0_#b59a7f]"}`}>
                    <div className={`w-full h-full scale-[1.3] drop-shadow-md transition-transform group-hover:scale-[1.4] ${ing.icon}`} />
                  </div>
                  <span className={`font-luckiest-guy text-[10px] md:text-xs tracking-widest drop-shadow-md uppercase text-center max-w-[80px] leading-tight ${ing.action ? "text-orange-300" : "text-white"}`}>
                    {ing.name}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResult = () => (
    <div className="flex flex-col h-screen bg-[#FFF8E7] items-center justify-center p-6 relative overflow-hidden">
       {/* Burst background */}
       <div className="absolute inset-0 z-0 flex items-center justify-center">
         <motion.div 
           animate={{ rotate: 360 }} 
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="w-[150vw] h-[150vw] bg-[conic-gradient(from_0deg,#FFF8E7_0deg,#FFEDD5_30deg,#FFF8E7_60deg,#FFEDD5_90deg,#FFF8E7_120deg,#FFEDD5_150deg,#FFF8E7_180deg,#FFEDD5_210deg,#FFF8E7_240deg,#FFEDD5_270deg,#FFF8E7_300deg,#FFEDD5_330deg,#FFF8E7_360deg)]" 
         />
       </div>

       <motion.div 
         initial={{ scale: 0.8, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-white text-center z-10 max-w-lg w-full"
       >
         <h2 className="text-6xl font-luckiest-guy text-[#FFB800] tracking-wider drop-shadow-[0_4px_0_#8B4513] mb-8" style={{ WebkitTextStroke: '2px #5C2A0A' }}>
           {score > 0 ? "ORDER UP!" : "OH NO!"}
         </h2>
         
         {score > 0 && recipe?.final && (
           <motion.div
             initial={{ scale: 0.5, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.15, type: "spring", bounce: 0.5 }}
             className="mx-auto -mt-4 mb-4 flex flex-col items-center"
           >
             <div className="w-48 h-36 md:w-60 md:h-44">
               <DishPreview final={recipe.final} />
             </div>
             <p className="font-luckiest-guy text-xl text-stone-700 tracking-wide">{recipe.targetDishName}</p>
           </motion.div>
         )}

         <div className="flex justify-center gap-4 mb-10">
           {[...Array(3)].map((_, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 50, rotate: -45 }}
               animate={{ opacity: 1, y: 0, rotate: 0 }}
               transition={{ delay: 0.3 + (i * 0.2), type: "spring", bounce: 0.6 }}
             >
               <Star 
                 size={64} 
                 className={i < score ? "text-yellow-400 fill-yellow-400 drop-shadow-md" : "text-stone-200 fill-stone-200"} 
               />
             </motion.div>
           ))}
         </div>
         
         <p className="text-xl text-stone-600 font-sans font-medium mb-12">
           {score === 3 ? "Perfect order! The customer loved it." : 
            score === 2 ? "Good job! But it could be better." : 
            score === 1 ? "Barely passed... They were not impressed." : 
            "You messed up the order! Try again."}
         </p>
         
         <button 
           onClick={handleFinish}
           className="w-full bg-orange-500 hover:bg-orange-600 text-white font-luckiest-guy text-3xl px-8 py-5 rounded-full shadow-[0_8px_0_#C2410C] hover:shadow-[0_4px_0_#C2410C] hover:translate-y-1 transition-all"
         >
           CONTINUE
         </button>
       </motion.div>
    </div>
  );

  return (
    <main className="min-h-screen bg-stone-50 font-sans selection:bg-amber-200">
      {/* Do NOT render HUD during cooking to avoid overlapping headers */}
      {phase !== 'result' && phase !== 'cooking' && renderHUD()}
      
      <AnimatePresence mode="wait">
        {phase === 'dialogue' && (
          <motion.div key="dialogue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen">
            {renderDialogue()}
          </motion.div>
        )}
        
        {phase === 'cooking' && (
          <motion.div key="cooking" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-screen">
            {renderCooking()}
          </motion.div>
        )}
        
        {phase === 'result' && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen">
            {renderResult()}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
