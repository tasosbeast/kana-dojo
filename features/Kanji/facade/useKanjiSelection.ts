'use client';

import { useShallow } from 'zustand/react/shallow';
import useKanjiStore from '../store/useKanjiStore';
import type { IKanjiObj } from '../store/useKanjiStore';

/**
 * Kanji Selection Facade - Public API for selection state
 *
 * Abstracts the internal Kanji store structure
 */

export interface KanjiSelection {
  selectedKanji: IKanjiObj[];
  selectedSets: string[];
  selectedCollection: 'n5' | 'n4' | 'n3' | 'n2' | 'n1';
  totalSelected: number;
  isEmpty: boolean;
  gameMode: string;
}

export interface KanjiSelectionActions {
  addKanji: (kanji: IKanjiObj) => void;
  addKanjiList: (kanjis: IKanjiObj[]) => void;
  clearKanji: () => void;
  setCollection: (collection: 'n5' | 'n4' | 'n3' | 'n2' | 'n1') => void;
  setSets: (sets: string[]) => void;
  clearSets: () => void;
  setGameMode: (mode: string) => void;
}

export function useKanjiSelection(): KanjiSelection & KanjiSelectionActions {
  return useKanjiStore(
    useShallow(state => ({
      // State
      selectedKanji: state.selectedKanjiObjs,
      selectedSets: state.selectedKanjiSets,
      selectedCollection: state.selectedKanjiCollection,
      totalSelected: state.selectedKanjiObjs.length,
      isEmpty: state.selectedKanjiObjs.length === 0,
      gameMode: state.selectedGameModeKanji,

      // Actions
      addKanji: state.addKanjiObj,
      addKanjiList: state.addKanjiObjs,
      clearKanji: state.clearKanjiObjs,
      setCollection: state.setSelectedKanjiCollection,
      setSets: state.setSelectedKanjiSets,
      clearSets: state.clearKanjiSets,
      setGameMode: state.setSelectedGameModeKanji
    }))
  );
}
