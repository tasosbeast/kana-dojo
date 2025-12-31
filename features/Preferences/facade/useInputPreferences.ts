'use client';

import { useShallow } from 'zustand/react/shallow';
import usePreferencesStore from '../store/usePreferencesStore';

export interface InputPreferences {
  hotkeysOn: boolean;
  setHotkeys: (hotkeys: boolean) => void;
}

/**
 * Input Preferences Facade
 *
 * Provides access to input-related preferences (hotkeys, etc.)
 */
export function useInputPreferences(): InputPreferences {
  return usePreferencesStore(
    useShallow(state => ({
      hotkeysOn: state.hotkeysOn,
      setHotkeys: state.setHotkeys
    }))
  ) as InputPreferences;
}
