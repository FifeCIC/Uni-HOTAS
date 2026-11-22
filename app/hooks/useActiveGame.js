import { useMemo } from 'react';
import useGameStore from '../stores/useGameStore';
import { getGameById, hasProfileAdapter } from '../data/games';

/**
 * useActiveGame — the active game record plus the one predicate callers need.
 *
 * `hasAdapter` is true only when a profile adapter exists today. Callers use it to show
 * an honest state instead of parsing another game's files with the Star Citizen adapter.
 */
export default function useActiveGame() {
  const activeGameId = useGameStore((state) => state.activeGameId);
  const setActiveGame = useGameStore((state) => state.setActiveGame);

  const activeGame = useMemo(() => getGameById(activeGameId), [activeGameId]);

  return {
    activeGame,
    setActiveGame,
    hasAdapter: hasProfileAdapter(activeGame),
  };
}
