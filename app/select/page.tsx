"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/store";
import { prefetchLevels } from "@/lib/preload";
import restaurantsData from "@/data/restaurants.json";
import { Star, Lock, ArrowLeft, Map } from "lucide-react";

export default function SelectScreen() {
  const { profile, progress } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setMounted(true);
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setCurrentDate(`${dd}-${mm}-${yyyy}`);
  }, []);

  // While the player picks a level, quietly load the ones they can play.
  useEffect(() => {
    prefetchLevels(restaurantsData.filter((r) => progress[r.id]?.unlocked).map((r) => r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FFF8E7] p-6 md:p-8 relative font-sans overflow-hidden">
      
      {/* Gamified Background Pattern (Subtle Checkered/Polka or just shapes) */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8B4513 2px, transparent 2px)', backgroundSize: '32px 32px' }}>
      </div>
      
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-400/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border-4 border-white shadow-[0_8px_30px_rgba(139,69,19,0.05)]">
          <div className="flex-1">
            <Link href="/profile" className="inline-flex items-center text-orange-600 hover:text-orange-700 bg-orange-100 hover:bg-orange-200 px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase mb-4 transition-colors shadow-sm">
              <ArrowLeft size={16} className="mr-2" strokeWidth={3} />
              Back to Profile
            </Link>
            
            <h1 className="text-5xl md:text-6xl font-luckiest-guy text-[#FFB800] tracking-wider drop-shadow-[0_4px_0_#8B4513]"
                style={{ WebkitTextStroke: '2px #5C2A0A' }}>
              LEVEL SELECT
            </h1>
            <p className="text-orange-800 mt-2 text-2xl font-roasted tracking-wide">
              Where are we cooking today, Chef?
            </p>
          </div>
          
          {/* Mini ID Card (Player Profile) */}
          <Link href="/profile" className="block transform transition-transform hover:scale-105 hover:rotate-2">
            <div className="flex items-center gap-4 bg-[#FDFCFB] pr-8 pl-4 py-3 rounded-2xl shadow-[0_8px_0_#D6C5B3] border-4 border-white relative overflow-visible">
              
              {/* Hole punch detail */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-stone-200 rounded-full shadow-inner" />
              
              {/* Avatar Box with pop-out image */}
              <div className="relative w-16 h-16 bg-amber-400 rounded-xl border-4 border-white flex items-end justify-center shadow-inner mt-2 z-10">
                 <img 
                    src={profile.avatar?.face?.startsWith("/") ? profile.avatar.face : "/assets/avatars/avatar1.webp"} 
                    alt="Player Avatar"
                    className="absolute bottom-0 w-[150%] max-w-none object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] select-none" 
                 />
              </div>
              
              <div className="flex flex-col mt-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-stone-400 mb-0.5">
                  ID: {currentDate}
                </span>
                <span className="font-roasted text-3xl text-orange-600 leading-none uppercase tracking-wide">
                  {profile.name || "GUEST"}
                </span>
              </div>
            </div>
          </Link>
        </header>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
          {restaurantsData.map((restaurant, index) => {
            const isUnlocked = progress[restaurant.id]?.unlocked;
            const stars = progress[restaurant.id]?.stars || 0;
            const imageUrl = (restaurant as any).image;
            
            return (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1, type: "spring", bounce: 0.4 }}
                className={`relative ${!isUnlocked ? "opacity-75 grayscale-[0.3]" : ""}`}
              >
                <Link href={isUnlocked ? `/play/${restaurant.id}` : "#"} className="block h-full cursor-pointer group">
                  <div className={`relative h-full flex flex-col overflow-hidden bg-white rounded-[2rem] transition-all duration-300
                    ${isUnlocked 
                      ? 'border-4 border-orange-200 hover:border-orange-400 shadow-[0_12px_0_#FDBA74] hover:shadow-[0_6px_0_#FDBA74] hover:translate-y-[6px]' 
                      : 'border-4 border-stone-200 shadow-[0_12px_0_#E7E5E4]'
                    }
                  `}>
                    
                    {/* Cover Image Area */}
                    <div className="relative h-48 w-full bg-stone-100 border-b-4 border-stone-100/50 overflow-hidden shrink-0">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                         <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                            <Map size={48} className="text-stone-300" />
                         </div>
                      )}
                      
                      {/* Gradient overlay for text readability if needed */}
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

                      {/* Top Badges overlayed on image */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                        <span className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full border-2 shadow-md backdrop-blur-sm
                          ${isUnlocked 
                            ? 'text-white bg-orange-500/90 border-orange-600' 
                            : 'text-stone-600 bg-stone-200/90 border-stone-400'
                          }`}>
                          {restaurant.cuisine}
                        </span>
                        
                        {!isUnlocked && (
                          <div className="text-white bg-stone-500/90 backdrop-blur-md p-2.5 rounded-full border-2 border-stone-400 shadow-md">
                            <Lock size={18} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Text Content */}
                    <div className="p-6 flex flex-col justify-between flex-1 relative z-10 bg-white">
                      <div className="mb-6">
                        <h3 className={`text-3xl sm:text-4xl font-luckiest-guy mb-3 tracking-wide
                          ${isUnlocked ? 'text-stone-800' : 'text-stone-400'}
                        `}>
                          {restaurant.name}
                        </h3>
                        <p className="text-[15px] text-stone-500 font-sans font-medium leading-relaxed line-clamp-2">
                          {restaurant.description}
                        </p>
                      </div>
                      
                      {/* Footer: Stars */}
                      <div className="flex justify-between items-center pt-5 border-t-2 border-stone-100/80">
                        {/* Difficulty Indicator */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase mb-1">Difficulty</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={14} 
                                className={i < restaurant.difficulty 
                                  ? (isUnlocked ? "text-orange-400 fill-orange-400" : "text-stone-400 fill-stone-400") 
                                  : "text-stone-200 fill-stone-200"
                                } 
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Completion Stars (Player Progress) */}
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase mb-1">Rating</span>
                          <div className={`flex gap-1 px-3 py-1.5 rounded-full border-2 ${isUnlocked ? 'bg-amber-100 border-amber-200' : 'bg-stone-100 border-stone-200'}`}>
                            {[...Array(3)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={14} 
                                className={i < stars 
                                  ? "text-yellow-500 fill-yellow-500" 
                                  : (isUnlocked ? "text-amber-200 fill-amber-200" : "text-stone-300 fill-stone-300")
                                } 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
