import { create } from 'zustand';

// Mood cut-offs shared by the face, the mood bar and the star rating.
export const MOOD_HAPPY = 75;
export const MOOD_OK = 40;

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
  removeLastIngredient: () => void;
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

  removeLastIngredient: () => set((state) => ({
    assembledIngredients: state.assembledIngredients.slice(0, -1)
  })),

  clearIngredients: () => set({ assembledIngredients: [] }),

  serveFood: (isCorrect) => set((state) => {
    let finalStars = 0;
    if (isCorrect) {
      if (state.customerMood >= MOOD_HAPPY) finalStars = 3;
      else if (state.customerMood >= MOOD_OK) finalStars = 2;
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
