'use client';

import { useShallow } from 'zustand/react/shallow';
import useKanaStore from '../store/useKanaStore';

/**
 * Kana Selection Facade - Public API for selection state
 *
 * Abstracts the internal Kana store structure
 */

export interface KanaSelection {
  selectedGroupIndices: number[];
  totalSelected: number;
  isEmpty: boolean;
  gameMode: string;
}

export interface KanaSelectionActions {
  addGroup: (index: number) => void;
  addGroups: (indices: number[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  isGroupSelected: (index: number) => boolean;
  setGameMode: (mode: string) => void;
}

export function useKanaSelection(): KanaSelection & KanaSelectionActions {
  return useKanaStore(
    useShallow(state => ({
      // State
      selectedGroupIndices: state.kanaGroupIndices,
      totalSelected: state.kanaGroupIndices.length,
      isEmpty: state.kanaGroupIndices.length === 0,
      gameMode: state.selectedGameModeKana,

      // Actions
      addGroup: state.addKanaGroupIndex,
      addGroups: state.addKanaGroupIndices,
      clearSelection: () => {
        // Toggle all currently selected groups to clear them
        state.addKanaGroupIndices(state.kanaGroupIndices);
      },
      selectAll: () => {
        // Select all 69 kana groups (based on kana.ts data)
        const allIndices = Array.from({ length: 69 }, (_, i) => i);
        state.addKanaGroupIndices(allIndices);
      },
      isGroupSelected: (index: number) => state.kanaGroupIndices.includes(index),
      setGameMode: state.setSelectedGameModeKana
    }))
  );
}
