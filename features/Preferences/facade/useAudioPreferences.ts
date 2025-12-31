'use client';

import { useShallow } from 'zustand/react/shallow';
import usePreferencesStore from '../store/usePreferencesStore';

export interface AudioPreferences {
  silentMode: boolean;
  setSilentMode: (silent: boolean) => void;
  pronunciationEnabled: boolean;
  setPronunciationEnabled: (enabled: boolean) => void;
  pronunciationSpeed: number;
  setPronunciationSpeed: (speed: number) => void;
  pronunciationPitch: number;
  setPronunciationPitch: (pitch: number) => void;
  pronunciationVoiceName: string | null;
  setPronunciationVoiceName: (name: string | null) => void;
}

/**
 * Audio Preferences Facade
 *
 * Provides access to audio-related preferences
 */
export function useAudioPreferences(): AudioPreferences {
  return usePreferencesStore(
    useShallow(state => ({
      silentMode: state.silentMode,
      setSilentMode: state.setSilentMode,
      pronunciationEnabled: state.pronunciationEnabled,
      setPronunciationEnabled: state.setPronunciationEnabled,
      pronunciationSpeed: state.pronunciationSpeed,
      setPronunciationSpeed: state.setPronunciationSpeed,
      pronunciationPitch: state.pronunciationPitch,
      setPronunciationPitch: state.setPronunciationPitch,
      pronunciationVoiceName: state.pronunciationVoiceName,
      setPronunciationVoiceName: state.setPronunciationVoiceName
    }))
  ) as AudioPreferences;
}
