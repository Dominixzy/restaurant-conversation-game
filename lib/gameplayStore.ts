import { create } from 'zustand';

// Mood cut-offs shared by the face, the mood bar and the star rating.
export const MOOD_HAPPY = 75;
export const MOOD_OK = 40;

// 'serving' shows how one customer liked their dish; 'result' is the summary after the last customer.
type GamePhase = 'dialogue' | 'cooking' | 'serving' | 'result';

// One served order, kept so the summary can show every ticket.
export interface ServedOrder {
  recipeId: string;
  stars: number;
}

// A fresh customer: start their conversation with a neutral mood and an empty plate.
const NEW_CUSTOMER = {
  phase: 'dialogue' as GamePhase,
  currentNodeId: 'start',
  customerMood: 50,
  score: 0,
  currentRecipeId: null,
  assembledIngredients: [] as string[],
};

interface GameplayState {
  currentRestaurantId: string | null;
  phase: GamePhase;
  currentNodeId: string;
  customerMood: number; // 0 to 100
  score: number; // stars earned for the current customer
  customerIndex: number; // which customer of the level is being served
  served: ServedOrder[];
  
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
  nextCustomer: () => void;
  showSummary: () => void;
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
  customerIndex: 0,
  served: [],

  startGame: (restaurantId) => set({
    ...NEW_CUSTOMER,
    currentRestaurantId: restaurantId,
    customerIndex: 0,
    served: [],
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
      phase: 'serving',
      score: finalStars,
      served: [...state.served, { recipeId: state.currentRecipeId ?? '', stars: finalStars }]
    };
  }),

  nextCustomer: () => set((state) => ({ ...NEW_CUSTOMER, customerIndex: state.customerIndex + 1 })),

  showSummary: () => set({ phase: 'result' }),

  resetGame: () => set({
    ...NEW_CUSTOMER,
    currentRestaurantId: null,
    customerIndex: 0,
    served: [],
  })
}));
