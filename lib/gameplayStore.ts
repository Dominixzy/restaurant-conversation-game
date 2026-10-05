import { create } from 'zustand';

type GamePhase = 'dialogue' | 'cooking' | 'serving' | 'result';

interface GameplayState {
  currentRestaurantId: string | null;
  phase: GamePhase;
  currentNodeId: string;
  customerMood: number; // 0 to 100
  score: number; // stars earned
  
  // Cooking state
  currentRecipeId: string | null;
  assembledIngredients: string[];
  
  // Actions
  startGame: (restaurantId: string) => void;
  makeChoice: (nextNodeId: string, moodChange: number, action?: string, recipeId?: string) => void;
  addIngredient: (ingredientId: string) => void;
  clearIngredients: () => void;
  serveFood: (isCorrect: boolean) => void;
  resetGame: () => void;
}

export const useGameplayStore = create<GameplayState>((set) => ({
  currentRestaurantId: null,
  phase: 'dialogue',
  currentNodeId: 'start',
  customerMood: 50,
  score: 0,
  currentRecipeId: null,
  assembledIngredients: [],

  startGame: (restaurantId) => set({
    currentRestaurantId: restaurantId,
    phase: 'dialogue',
    currentNodeId: 'start',
    customerMood: 50,
    score: 0,
    currentRecipeId: null,
    assembledIngredients: []
  }),

  makeChoice: (nextNodeId, moodChange, action, recipeId) => set((state) => {
    const newMood = Math.min(100, Math.max(0, state.customerMood + (moodChange * 25)));
    
    if (action === 'start_cooking') {
      return {
        currentNodeId: nextNodeId,
        customerMood: newMood,
        phase: 'cooking',
        currentRecipeId: recipeId
      };
    }
    
    return {
      currentNodeId: nextNodeId,
      customerMood: newMood
    };
  }),

  addIngredient: (ingredientId) => set((state) => ({
    assembledIngredients: [...state.assembledIngredients, ingredientId]
  })),

  clearIngredients: () => set({ assembledIngredients: [] }),

  serveFood: (isCorrect) => set((state) => {
    let finalStars = 0;
    if (isCorrect) {
      if (state.customerMood >= 75) finalStars = 3;
      else if (state.customerMood >= 40) finalStars = 2;
      else finalStars = 1;
    } else {
      finalStars = 0; // failed
    }

    return {
      phase: 'result',
      score: finalStars
    };
  }),

  resetGame: () => set({
    currentRestaurantId: null,
    phase: 'dialogue',
    currentNodeId: 'start',
    customerMood: 50,
    score: 0,
    currentRecipeId: null,
    assembledIngredients: []
  })
}));
