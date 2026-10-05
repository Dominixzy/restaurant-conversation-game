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

// How well a cooking step (Bake, Cut…) was done in its mini-game; plain ingredients have none.
// 'under' / 'over' mean undercooked / overcooked (raw or burnt pizza, hard or soggy pasta).
export type StepQuality = 'perfect' | 'ok' | 'bad' | 'under' | 'over' | null;
export const isBadStep = (q: StepQuality) => q === 'bad' || q === 'under' || q === 'over';

// A fresh customer: start their conversation with a neutral mood and an empty plate.
const NEW_CUSTOMER = {
  phase: 'dialogue' as GamePhase,
  currentNodeId: 'start',
  customerMood: 50,
  score: 0,
  currentRecipeId: null,
  assembledIngredients: [] as string[],
  stepQuality: [] as StepQuality[],
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
  stepQuality: StepQuality[]; // one entry per item in assembledIngredients
  
  // Actions
  startGame: (restaurantId: string) => void;
  makeChoice: (nextNodeId: string, moodChange: number, action?: string, recipeId?: string) => void;
  addIngredient: (ingredientId: string, quality?: StepQuality) => void;
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
  stepQuality: [],
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

  addIngredient: (ingredientId, quality = null) => set((state) => ({
    assembledIngredients: [...state.assembledIngredients, ingredientId],
    stepQuality: [...state.stepQuality, quality]
  })),

  removeLastIngredient: () => set((state) => ({
    assembledIngredients: state.assembledIngredients.slice(0, -1),
    stepQuality: state.stepQuality.slice(0, -1)
  })),

  clearIngredients: () => set({ assembledIngredients: [], stepQuality: [] }),

  serveFood: (isCorrect) => set((state) => {
    let finalStars = 0;
    if (isCorrect) {
      if (state.customerMood >= MOOD_HAPPY) finalStars = 3;
      else if (state.customerMood >= MOOD_OK) finalStars = 2;
      else finalStars = 1;
      // Each badly done step (burnt, uneven cuts…) costs a star, but a correct dish keeps at least one.
      const badSteps = state.stepQuality.filter(isBadStep).length;
      finalStars = Math.max(1, finalStars - badSteps);
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
