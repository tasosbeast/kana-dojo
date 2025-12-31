// ============================================================================
// Progress Feature - Public API
// ============================================================================

// Facades (PRIMARY API - Use these in new code)
export {
  useGameStats,
  useStatsDisplay,
  useSessionStats,
  useTimedStats
} from './facade';
export type {
  GameStats,
  GameStatsActions,
  StatsDisplay,
  SessionStats,
  TimedStats
} from './facade';

// Components (page-level)
export { default as ProgressWithSidebar } from './components/ProgressWithSidebar';
export { default as SimpleProgress } from './components/SimpleProgress';

// ============================================================================
// PRIVATE - DO NOT IMPORT DIRECTLY
// ============================================================================
// - store/useStatsStore.ts (use facades instead)
// - lib/progressUtils.ts (internal)
