// ============================================================================
// Preferences Feature - Public API
// ============================================================================

// Facades (PRIMARY API - Use these in new code)
export {
  useAudioPreferences,
  useThemePreferences,
  useInputPreferences
} from './facade';
export type {
  AudioPreferences,
  InputPreferences
} from './facade';

// Components (page-level)
export { default as ThemesModal } from './components/ThemesModal';

// Data (read-only) - Note: Import defaults, not named exports
// export { default as themes } from './data/themes';
// export { default as fonts } from './data/fonts';

// ============================================================================
// PRIVATE - DO NOT IMPORT DIRECTLY
// ============================================================================
// - store/usePreferencesStore.ts (use facades instead)
// - lib/themeHelpers.ts (internal)
