"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChefHat, UtensilsCrossed, Sparkles } from "lucide-react";
import { prefetchLevels } from "@/lib/preload";
import restaurantsData from "@/data/restaurants.json";

export default function Home() {
  const router = useRouter();

  // While the title shows, fetch what comes next: the chef photos, the level covers and the first level.
  useEffect(() => {
    const covers = restaurantsData.map((r) => r.image);
    prefetchLevels(["r1"], ["/assets/avatars/avatar1.webp", "/assets/avatars/avatar2.webp", "/assets/avatars/avatar3.webp", ...covers]);
  }, []);

  return (
    <main 
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-stone-950 text-white cursor-pointer"
      onClick={() => router.push("/profile")}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="relative w-full h-full">
          <img 
            src="/assets/restaurant.webp" 
            alt="Restaurant Background" 
            fetchPriority="high"
            className="object-cover w-full h-full opacity-100 brightness-[0.6]"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      </div>
      
      {/* UI Elements */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="z-10 flex flex-col items-center text-center space-y-12 max-w-5xl px-6 w-full pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          {/* Wrapper for the floating title and its cute decorations */}
          <motion.div 
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative"
          >
            {/* Cute Chef Hat perched playfully on the first 'R' */}
            <motion.div
              animate={{ rotate: [-12, -8, -12] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -top-16 -left-6 z-20 drop-shadow-[0_6px_0_#5C2A0A]"
            >
              <ChefHat 
                size={110} 
                className="text-white drop-shadow-xl" 
                strokeWidth={2}
                fill="white"
              />
            </motion.div>

            {/* Crossed Utensils tucked behind the 'T' on the right */}
            <div className="absolute -top-6 -right-12 z-0 drop-shadow-[0_4px_0_#5C2A0A] opacity-90">
              <UtensilsCrossed
                size={90}
                className="text-stone-200 rotate-[15deg]"
                strokeWidth={2}
              />
            </div>

            {/* Magical Sparkles around the title */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              className="absolute top-2 right-[25%] z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            >
              <Sparkles size={32} className="text-amber-200" fill="#FDE68A" />
            </motion.div>
            
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute -bottom-4 left-[20%] z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            >
              <Sparkles size={40} className="text-amber-300" fill="#FCD34D" />
            </motion.div>

            {/* Main Title */}
            <h1 
              className="text-7xl md:text-[9rem] lg:text-[11rem] font-luckiest-guy text-[#FFB800] drop-shadow-[0_8px_0_#8B4513] leading-none tracking-wider mb-2 relative z-10"
              style={{ 
                WebkitTextStroke: '4px #5C2A0A',
                textShadow: '0 10px 20px rgba(0,0,0,0.8), 0 0 40px rgba(255,184,0,0.4)'
              }}
            >
              RESTAURANT
            </h1>
          </motion.div>
        </motion.div>

        {/* Flashing "Tap anywhere to start" text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 absolute bottom-24"
        >
          <motion.p 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="font-sans font-bold text-xl md:text-2xl tracking-[0.3em] uppercase text-stone-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          >
            Tap anywhere to start
          </motion.p>
        </motion.div>
      </motion.div>
    </main>
  );
}
