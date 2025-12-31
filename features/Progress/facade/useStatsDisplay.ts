'use client';

import { useShallow } from 'zustand/react/shallow';
import useStatsStore from '../store/useStatsStore';

export interface StatsDisplay {
  correctAnswers: number;
  wrongAnswers: number;
  currentStreak: number;
  bestStreak: number;
  stars: number;
  characterHistory: string[];
  characterScores: Record<string, { correct: number; wrong: number }>;
  showStats: boolean;
  toggleStats: () => void;
  iconIndices: number[];
  score: number;
  setScore: (score: number) => void;
  setStars: (stars: number) => void;
  addIconIndex: (index: number) => void;
  setNewTotalMilliseconds: (ms: number) => void;
  saveSession: () => void;
  totalMilliseconds: number;
  correctAnswerTimes: number[];
  totalSessions: number;
  totalCorrect: number;
  totalIncorrect: number;
  characterMastery: Record<string, { correct: number; incorrect: number }>;
}

/**
 * Read-only stats access for display components
 *
 * Use this facade when components only need to display stats,
 * not modify them.
 */
export function useStatsDisplay(): StatsDisplay {
  return useStatsStore(
    useShallow(state => ({
      correctAnswers: state.numCorrectAnswers,
      wrongAnswers: state.numWrongAnswers,
      currentStreak: state.currentStreak,
      bestStreak: state.allTimeStats.bestStreak,
      stars: state.stars,
      characterHistory: state.characterHistory,
      characterScores: state.characterScores,
      showStats: state.showStats,
      toggleStats: state.toggleStats,
      iconIndices: state.iconIndices,
      score: state.score,
      setScore: state.setScore,
      setStars: state.setStars,
      addIconIndex: state.addIconIndex,
      setNewTotalMilliseconds: state.setNewTotalMilliseconds,
      saveSession: state.saveSession,
      totalMilliseconds: state.totalMilliseconds,
      correctAnswerTimes: state.correctAnswerTimes,

      // All-time stats
      totalSessions: state.allTimeStats.totalSessions,
      totalCorrect: state.allTimeStats.totalCorrect,
      totalIncorrect: state.allTimeStats.totalIncorrect,
      characterMastery: state.allTimeStats.characterMastery
    }))
  ) as StatsDisplay;
}

export interface SessionStats {
  sessionCorrect: number;
  sessionWrong: number;
  sessionStreak: number;
}

/**
 * Read-only session stats for in-game UI
 */
export function useSessionStats(): SessionStats {
  return useStatsStore(
    useShallow(state => ({
      sessionCorrect: state.numCorrectAnswers,
      sessionWrong: state.numWrongAnswers,
      sessionStreak: state.currentStreak
    }))
  ) as SessionStats;
}

export interface TimedStats {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  reset: () => void;
}

/**
 * Read-only timed mode stats (Blitz/Gauntlet)
 */
export function useTimedStats(contentType: 'kana' | 'kanji' | 'vocabulary'): TimedStats {
  return useStatsStore(
    useShallow(state => {
      switch (contentType) {
        case 'kana':
          return {
            correct: state.timedCorrectAnswers,
            wrong: state.timedWrongAnswers,
            streak: state.timedStreak,
            bestStreak: state.timedBestStreak,
            reset: state.resetTimedStats
          };
        case 'kanji':
          return {
            correct: state.timedKanjiCorrectAnswers,
            wrong: state.timedKanjiWrongAnswers,
            streak: state.timedKanjiStreak,
            bestStreak: state.timedKanjiBestStreak,
            reset: state.resetTimedKanjiStats
          };
        case 'vocabulary':
          return {
            correct: state.timedVocabCorrectAnswers,
            wrong: state.timedVocabWrongAnswers,
            streak: state.timedVocabStreak,
            bestStreak: state.timedVocabBestStreak,
            reset: state.resetTimedVocabStats
          };
      }
    })
  ) as TimedStats;
}
