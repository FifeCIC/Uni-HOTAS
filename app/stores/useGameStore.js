/**
 * Game Store — which title the app is currently configured for.
 *
 * WHY: Star Citizen profile paths, action maps and labels are game-specific. The active
 * game lives here so one selector can drive those surfaces, and so the choice survives a
 * reload. It is deliberately UI state only: the server keeps its own folder per game.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_GAME_ID, getGameById } from '../data/games';

const useGameStore = create(
  persist(
    (set) => ({
      activeGameId: DEFAULT_GAME_ID,
      setActiveGame: (gameId) => set({ activeGameId: getGameById(gameId).id }),
    }),
    {
      name: 'uni-hotas-game',
      partialize: (state) => ({ activeGameId: state.activeGameId }),
    }
  )
);

export default useGameStore;
