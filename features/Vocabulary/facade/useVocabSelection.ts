'use client';

import { useShallow } from 'zustand/react/shallow';
import useVocabStore from '../store/useVocabStore';
import type { IVocabObj } from '../store/useVocabStore';

/**
 * Vocabulary Selection Facade - Public API for selection state
 *
 * Abstracts the internal Vocabulary store structure
 */

export interface VocabSelection {
  selectedVocab: IVocabObj[];
  selectedSets: string[];
  selectedCollection: string;
  totalSelected: number;
  isEmpty: boolean;
  gameMode: string;
}

export interface VocabSelectionActions {
  addVocab: (vocab: IVocabObj) => void;
  addVocabList: (vocabs: IVocabObj[]) => void;
  clearVocab: () => void;
  setCollection: (collection: string) => void;
  setSets: (sets: string[]) => void;
  clearSets: () => void;
  setGameMode: (mode: string) => void;
}

export function useVocabSelection(): VocabSelection & VocabSelectionActions {
  return useVocabStore(
    useShallow(state => ({
      // State
      selectedVocab: state.selectedVocabObjs,
      selectedSets: state.selectedVocabSets,
      selectedCollection: state.selectedVocabCollection,
      totalSelected: state.selectedVocabObjs.length,
      isEmpty: state.selectedVocabObjs.length === 0,
      gameMode: state.selectedGameModeVocab,

      // Actions
      addVocab: state.addVocabObj,
      addVocabList: state.addVocabObjs,
      clearVocab: state.clearVocabObjs,
      setCollection: state.setSelectedVocabCollection,
      setSets: state.setSelectedVocabSets,
      clearSets: state.clearVocabSets,
      setGameMode: state.setSelectedGameModeVocab
    }))
  );
}
