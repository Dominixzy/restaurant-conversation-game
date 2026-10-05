import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Avatar {
  face: string
  hair: string
  outfit: string
}

export interface Profile {
  name: string
  avatar: Avatar
}

export interface RestaurantProgress {
  unlocked: boolean
  score: number
  stars: number
}

export interface GameState {
  profile: Profile
  progress: Record<string, RestaurantProgress>
  updateProfile: (profile: Partial<Profile>) => void
  unlockRestaurant: (restaurantId: string) => void
  updateProgress: (restaurantId: string, progress: Partial<RestaurantProgress>) => void
  completeLevel: (restaurantId: string, stars: number) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      profile: {
        name: '',
        avatar: { face: 'default', hair: 'default', outfit: 'default' }
      },
      progress: {
        'r1': { unlocked: true, score: 0, stars: 0 },
        'r2': { unlocked: false, score: 0, stars: 0 },
        'r3': { unlocked: false, score: 0, stars: 0 },
        'r4': { unlocked: false, score: 0, stars: 0 },
        'r5': { unlocked: false, score: 0, stars: 0 },
      },
      updateProfile: (profileData) => set((state) => ({
        profile: { ...state.profile, ...profileData }
      })),
      unlockRestaurant: (restaurantId) => set((state) => ({
        progress: {
          ...state.progress,
          [restaurantId]: { ...state.progress[restaurantId], unlocked: true }
        }
      })),
      updateProgress: (restaurantId, progressData) => set((state) => ({
        progress: {
          ...state.progress,
          [restaurantId]: { ...state.progress[restaurantId], ...progressData }
        }
      })),
      completeLevel: (restaurantId, stars) => set((state) => {
        // Unlock next restaurant logic
        let nextId = '';
        if (restaurantId === 'r1') nextId = 'r2';
        if (restaurantId === 'r2') nextId = 'r3';
        if (restaurantId === 'r3') nextId = 'r4';
        if (restaurantId === 'r4') nextId = 'r5';
        
        const currentStars = state.progress[restaurantId]?.stars || 0;
        
        return {
          progress: {
            ...state.progress,
            [restaurantId]: { 
              ...state.progress[restaurantId], 
              stars: Math.max(currentStars, stars) // keep highest stars
            },
            ...(nextId ? { [nextId]: { ...state.progress[nextId], unlocked: true } } : {})
          }
        };
      })
    }),
    {
      name: 'restaurant-game-storage',
    }
  )
)
