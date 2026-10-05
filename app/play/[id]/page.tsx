"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameplayStore } from "@/lib/gameplayStore";
import { useGameStore } from "@/lib/store";
import restaurantsData from "@/data/restaurants.json";
import dialoguesData from "@/data/dialogues.json";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { Heart, Star, ArrowLeft, Trash2, Check, ChefHat } from "lucide-react";

export default function PlayScreen() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  
  const restaurant = restaurantsData.find(r => r.id === restaurantId);
  const dialogueTree = (dialoguesData as any)[restaurantId];
  const { 
    phase, currentNodeId, customerMood, score, assembledIngredients, currentRecipeId,
    startGame, makeChoice, addIngredient, clearIngredients, serveFood, resetGame 
  } = useGameplayStore();

  const recipe = currentRecipeId ? (recipesData as any)[currentRecipeId] : null;

  const { completeLevel } = useGameStore();
  const [mounted, setMounted] = useState(false);

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
  const handleChoice = (choice: any) => {
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
    <div className="absolute top-0 inset-x-0 h-20 bg-black/40 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/select")} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="font-luckiest-guy text-2xl text-white tracking-wider drop-shadow-md">{restaurant.name}</h2>
          <p className="text-xs font-black tracking-widest text-orange-300 uppercase drop-shadow-md">Phase: {phase}</p>
        </div>
      </div>
      
      {/* Mood Bar utilizing 7.png icons */}
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
        <div className={`w-8 h-8 ${customerMood > 50 ? "bg-[url('/assets/food/sushi/7.png')] bg-[length:400%_200%] bg-[position:0%_100%]" : "bg-[url('/assets/food/sushi/7.png')] bg-[length:400%_200%] bg-[position:33.33%_100%]"} scale-125`} />
        <div className="w-32 h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
          <motion.div 
            className={`h-full ${customerMood >= 75 ? 'bg-green-400' : customerMood >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
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
      <div className="flex flex-col h-screen pt-20 relative overflow-hidden bg-stone-900">
        {/* Beautiful 2D Restaurant Interior Background */}
        <div className="absolute inset-0 bg-[url('/assets/food/sushi/5.png')] bg-cover bg-center bg-no-repeat opacity-90" />
             
        {/* Characters Container (Visual Novel Style) */}
        <div className="flex-1 flex items-end justify-between z-10 px-4 md:px-12 pb-4 min-h-0 max-w-5xl mx-auto w-full">
           
           {/* Chef (Player) - Left Side */}
           <motion.div 
             initial={{ x: -50, opacity: 0 }} 
             animate={{ x: 0, opacity: 1 }}
             className="relative aspect-[3/4] h-full max-h-[30vh] md:max-h-[40vh] shrink-0"
           >
              <div 
                className="w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)] scale-x-[-1]" 
                style={{
                  backgroundImage: "url('/assets/food/sushi/4.png')",
                  backgroundSize: "400% 300%",
                  backgroundPosition: "0% 0%",
                  backgroundRepeat: "no-repeat"
                }}
              />
           </motion.div>

           {/* Customer - Right Side */}
           <motion.div 
             initial={{ x: 50, opacity: 0 }} 
             animate={{ x: 0, opacity: 1 }}
             className="relative aspect-[3/4] h-full max-h-[30vh] md:max-h-[40vh] shrink-0"
           >
              {(() => {
                const customerBgImage = currentDialogue.customerImage;
                const isSprite = customerBgImage?.startsWith('bg-');
                let spriteUrl = '', spriteSize = '', spritePos = '';

                if (isSprite) {
                  const urlMatch = customerBgImage.match(/url\('([^']+)'\)/);
                  const sizeMatch = customerBgImage.match(/length:([^\]]+)/);
                  const posMatch = customerBgImage.match(/position:([^\]]+)/);
                  
                  if (urlMatch) spriteUrl = urlMatch[1];
                  if (sizeMatch) spriteSize = sizeMatch[1].replace('_', ' ');
                  if (posMatch) spritePos = posMatch[1].replace('_', ' ');
                  
                  return (
                    <div 
                      className="w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]" 
                      style={{
                        backgroundImage: `url('${spriteUrl}')`,
                        backgroundSize: spriteSize,
                        backgroundPosition: spritePos,
                        backgroundRepeat: "no-repeat"
                      }}
                    />
                  );
                }

                if (customerBgImage) {
                  return <img src={customerBgImage} alt="Customer" className="w-full h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]" />;
                }

                return (
                  <div className="w-full h-full bg-stone-300 rounded-[3rem] flex items-center justify-center">
                    <ChefHat size={64} className="text-stone-500" />
                  </div>
                );
              })()}
           </motion.div>
        </div>

        {/* Dialogue Box */}
        <div className="bg-white/95 backdrop-blur-xl border-t-8 border-orange-400 rounded-t-[3rem] p-6 md:p-10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] z-20 flex flex-col max-h-[55vh] shrink-0 mx-4 md:mx-auto md:w-full md:max-w-4xl rounded-b-none md:rounded-3xl md:mb-6">
           <div className="overflow-y-auto pr-2 custom-scrollbar flex flex-col h-full">
             <h3 className="text-2xl md:text-3xl font-luckiest-guy text-orange-600 mb-3 shrink-0 tracking-wide">Customer</h3>
             <p className="text-lg md:text-2xl font-sans font-medium text-stone-700 leading-relaxed mb-8 shrink-0">
               "{currentDialogue.text}"
             </p>
             
             <div className="flex flex-col gap-3 mt-auto pb-4">
               {currentDialogue.choices && currentDialogue.choices.length > 0 ? (
                 currentDialogue.choices.map((choice: any, idx: number) => (
                   <button 
                     key={idx}
                     onClick={() => handleChoice(choice)}
                     className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-400 text-left px-6 py-5 rounded-2xl transition-all duration-200 hover:scale-[1.01] hover:shadow-lg font-bold text-stone-700 hover:text-orange-900 text-base md:text-xl shrink-0 flex items-center justify-between group"
                   >
                     <span>{choice.text}</span>
                     <span className="opacity-0 group-hover:opacity-100 transition-opacity">🍣</span>
                   </button>
                 ))
               ) : (
                 <button 
                   onClick={() => makeChoice("", 0, currentDialogue.action, currentDialogue.recipeId)}
                   className="bg-orange-500 hover:bg-orange-600 border-2 border-orange-600 text-center text-white px-6 py-5 rounded-2xl transition-all duration-200 hover:scale-[1.01] shadow-xl font-luckiest-guy text-2xl shrink-0 tracking-widest uppercase"
                 >
                   {currentDialogue.action === 'start_cooking' ? 'Go to Kitchen 👨‍🍳' : 'Continue'}
                 </button>
               )}
             </div>
           </div>
        </div>
      </div>
    );
  };

  const renderCooking = () => {
    if (!recipe) return null;

    return (
      <div className="flex flex-col h-screen relative overflow-hidden bg-stone-900">
        {/* Background */}
        <div className="absolute inset-0 bg-[url('/assets/food/sushi/6.png')] bg-cover bg-center bg-no-repeat opacity-90" />
        
        {/* Characters in the Background (Positioned perfectly behind the counter) */}
        <div className="absolute inset-x-0 bottom-[35%] md:bottom-[40%] top-20 flex justify-center md:justify-between px-10 md:px-24 z-0 pointer-events-none">
           {/* Chef (Left) */}
           <div className="relative aspect-[3/4] h-full max-h-[45vh] md:max-h-[60vh] drop-shadow-2xl scale-x-[-1] -translate-x-8">
              <div 
                className="w-full h-full"
                style={{
                  backgroundImage: "url('/assets/food/sushi/4.png')",
                  backgroundSize: "400% 300%",
                  backgroundPosition: "0% 0%",
                  backgroundRepeat: "no-repeat"
                }}
              />
           </div>
           
           {/* Customer (Right) */}
           <div className="relative aspect-[3/4] h-full max-h-[45vh] md:max-h-[60vh] drop-shadow-2xl hidden md:block translate-x-8">
              <div 
                className="w-full h-full"
                style={{
                  backgroundImage: "url('/assets/food/sushi/4.png')",
                  backgroundSize: "400% 300%",
                  backgroundPosition: customerMood >= 70 ? "66.66% 0%" : customerMood >= 40 ? "66.66% 50%" : "66.66% 100%",
                  backgroundRepeat: "no-repeat"
                }}
              />
           </div>
        </div>

        {/* Top UI Bar (Custom for Cooking Phase) */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent flex items-start justify-between px-6 pt-6 z-50 pointer-events-none">
          <div className="flex items-center gap-4">
            <button 
              onClick={resetGame}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white pointer-events-auto backdrop-blur-md border border-white/20 shadow-lg"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="font-luckiest-guy text-3xl text-white tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">Sakura Sushi</h2>
              <p className="text-sm font-black tracking-widest text-orange-400 uppercase drop-shadow-md">Phase: Cooking</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md pl-2 pr-6 py-2 rounded-full border border-white/20 shadow-xl pointer-events-auto">
            <div 
              className="w-12 h-12 drop-shadow-md"
              style={{
                backgroundImage: "url('/assets/food/sushi/7.png')",
                backgroundSize: "400% 200%",
                backgroundPosition: customerMood >= 50 ? "0% 100%" : "33.33% 100%",
                backgroundRepeat: "no-repeat"
              }}
            />
            <div className="w-40 h-5 bg-black/60 rounded-full overflow-hidden border-2 border-stone-600 shadow-inner">
              <div 
                className={`h-full transition-all duration-500 ${customerMood > 60 ? 'bg-green-500' : customerMood > 30 ? 'bg-yellow-400' : 'bg-red-500'}`}
                style={{ width: `${customerMood}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Order Ticket (List of food to make) */}
        <div className="absolute top-28 left-8 bg-white/95 backdrop-blur-md px-6 py-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-l-8 border-orange-500 z-40 flex flex-col transform -rotate-2">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
             <h3 className="font-luckiest-guy text-sm text-stone-400 tracking-wider uppercase">Order Ticket</h3>
           </div>
           <p className="font-black text-2xl text-stone-800 border-b-2 border-stone-200 pb-2 mb-2">{recipe.targetDishName}</p>
           
           {/* Checklist of ingredients */}
           <div className="flex flex-col gap-1">
             {recipe.correctSequence.map((ingId: string, idx: number) => {
               const ing = ingredientsData.find((i: any) => i.id === ingId);
               const isDone = assembledIngredients[idx] === ingId;
               return (
                 <div key={idx} className="flex items-center gap-2">
                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isDone ? 'bg-green-500 border-green-600' : 'border-stone-300'}`}>
                     {isDone && <Check size={10} className="text-white" strokeWidth={4} />}
                   </div>
                   <span className={`text-sm font-bold ${isDone ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                     {ing?.name || ingId}
                   </span>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Action Buttons (Trash / Serve) - Moved OUTSIDE z-10 container to prevent overlap issues */}
        <div className="absolute right-6 md:right-12 bottom-44 md:bottom-48 flex flex-col gap-4 z-40 pointer-events-auto">
          <button
            onClick={clearIngredients}
            className="w-14 h-14 md:w-20 md:h-20 bg-stone-100 hover:bg-white border-4 border-stone-300 hover:border-red-400 rounded-2xl flex items-center justify-center text-stone-500 hover:text-red-500 transition-all hover:scale-110 shadow-lg group relative"
          >
            <Trash2 size={28} className="md:w-8 md:h-8" />
            <span className="absolute right-full mr-4 bg-black/80 text-white font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider text-sm whitespace-nowrap">Discard</span>
          </button>
          <button
            onClick={() => serveFood(true)}
            className="w-16 h-16 md:w-24 md:h-24 bg-orange-500 hover:bg-orange-400 border-4 border-orange-600 hover:border-orange-300 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-110 shadow-[0_8px_0_#9a3412] hover:shadow-[0_4px_0_#9a3412] hover:translate-y-1 active:shadow-none active:translate-y-2 group relative"
          >
            <Check size={40} strokeWidth={4} />
            <span className="absolute right-full mr-4 bg-orange-600 text-white font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider text-sm whitespace-nowrap">Serve!</span>
          </button>
        </div>

        {/* Central Cooking Area (The Countertop) */}
        <div className="flex-1 relative z-10 w-full max-w-7xl mx-auto flex items-end pb-44 pointer-events-none">
          
          {/* Center Area: Bamboo Mat + Plate */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-8 w-[280px] h-[280px] md:w-[480px] md:h-[480px] flex items-center justify-center">
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
              {/* Stacked Ingredients on the Plate - Shifted UP to center perfectly on the plate's visual center */}
              <div className="absolute inset-0 flex items-center justify-center -translate-y-12 md:-translate-y-16">
                <AnimatePresence>
                  {assembledIngredients.map((ingId, index) => {
                    const visualDef = ingredientsData.find((i: any) => i.id === ingId);
                    if (!visualDef) return null;

                    return (
                      <motion.div
                        key={`${ingId}-${index}`}
                        initial={{ y: -200, opacity: 0, scale: 0.5, rotate: -15 }}
                        animate={{ x: visualDef.xOffset || 0, y: visualDef.yOffset || 0, opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                        className="absolute inset-0 flex items-center justify-center drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)]"
                        style={{ zIndex: visualDef.zIndex || 10 }}
                      >
                        <div className={visualDef.className} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Bar (Bottom) - Now shows ALL possible ingredients! */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-stone-900/80 backdrop-blur-md border-t border-white/10 px-4 md:px-8 py-6 z-30 flex items-center gap-4 md:gap-6 overflow-x-auto custom-scrollbar">
          {ingredientsData.map((ing: any) => (
            <button
              key={ing.id}
              onClick={() => addIngredient(ing.id)}
              className="group relative flex flex-col items-center gap-2 shrink-0 pointer-events-auto"
            >
              {/* Bin Design resembling wooden blocks matching UI style */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f8f0e3] border-4 border-[#d4bca3] rounded-2xl shadow-[0_6px_0_#b59a7f] group-hover:shadow-[0_2px_0_#b59a7f] group-hover:translate-y-1 transition-all overflow-hidden flex items-center justify-center group-active:shadow-none group-active:translate-y-2">
                <div className={`w-full h-full scale-[1.3] drop-shadow-md transition-transform group-hover:scale-[1.4] ${ing.icon}`} />
              </div>
              <span className="font-luckiest-guy text-white text-[10px] md:text-xs tracking-widest drop-shadow-md uppercase text-center max-w-[80px] leading-tight">
                {ing.name}
              </span>
            </button>
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
