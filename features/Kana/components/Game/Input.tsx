'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { kana } from '@/features/Kana/data/kana';
import useKanaStore from '@/features/Kana/store/useKanaStore';
import { CircleCheck, CircleX, CircleArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useClick, useCorrect, useError } from '@/shared/hooks/useAudio';
import GameIntel from '@/shared/components/Game/GameIntel';
import { useStopwatch } from 'react-timer-hook';
import useStats from '@/shared/hooks/useStats';
import useStatsStore from '@/features/Progress/store/useStatsStore';
import { useShallow } from 'zustand/react/shallow';
import Stars from '@/shared/components/Game/Stars';
import { useCrazyModeTrigger } from '@/features/CrazyMode/hooks/useCrazyModeTrigger';
import { getGlobalAdaptiveSelector } from '@/shared/lib/adaptiveSelection';
import { ActionButton } from '@/shared/components/ui/ActionButton';

// Get the global adaptive selector for weighted character selection
const adaptiveSelector = getGlobalAdaptiveSelector();

// Helper function to determine if a kana character is hiragana or katakana
const isHiragana = (char: string): boolean => {
  // Hiragana Unicode range: U+3040 to U+309F
  const code = char.charCodeAt(0);
  return code >= 0x3040 && code <= 0x309f;
};

const isKatakana = (char: string): boolean => {
  // Katakana Unicode range: U+30A0 to U+30FF
  const code = char.charCodeAt(0);
  return code >= 0x30a0 && code <= 0x30ff;
};

// Bottom bar states
type BottomBarState = 'check' | 'correct' | 'wrong';

interface InputGameProps {
  isHidden: boolean;
  isReverse?: boolean;
}

const InputGame = ({ isHidden, isReverse = false }: InputGameProps) => {
  const {
    score,
    setScore,
    incrementHiraganaCorrect,
    incrementKatakanaCorrect,
    recordAnswerTime,
    incrementWrongStreak,
    resetWrongStreak
  } = useStatsStore(
    useShallow(state => ({
      score: state.score,
      setScore: state.setScore,
      incrementHiraganaCorrect: state.incrementHiraganaCorrect,
      incrementKatakanaCorrect: state.incrementKatakanaCorrect,
      recordAnswerTime: state.recordAnswerTime,
      incrementWrongStreak: state.incrementWrongStreak,
      resetWrongStreak: state.resetWrongStreak
    }))
  );

  const speedStopwatch = useStopwatch({ autoStart: false });

  const {
    incrementCorrectAnswers,
    incrementWrongAnswers,
    addCharacterToHistory,
    addCorrectAnswerTime,
    incrementCharacterScore
  } = useStats();

  const { playClick } = useClick();
  const { playCorrect } = useCorrect();
  const { playErrorTwice } = useError();
  const { trigger: triggerCrazyMode } = useCrazyModeTrigger();

  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [inputValue, setInputValue] = useState('');
  const [bottomBarState, setBottomBarState] = useState<BottomBarState>('check');
  const [lastWrongInput, setLastWrongInput] = useState('');

  const kanaGroupIndices = useKanaStore(state => state.kanaGroupIndices);

  const selectedKana = useMemo(
    () => kanaGroupIndices.map(i => kana[i].kana).flat(),
    [kanaGroupIndices]
  );
  const selectedRomaji = useMemo(
    () => kanaGroupIndices.map(i => kana[i].romanji).flat(),
    [kanaGroupIndices]
  );

  // Create mapping pairs based on mode
  const selectedPairs = useMemo(
    () =>
      Object.fromEntries(
        isReverse
          ? selectedRomaji.map((key, i) => [key, selectedKana[i]])
          : selectedKana.map((key, i) => [key, selectedRomaji[i]])
      ),
    [isReverse, selectedRomaji, selectedKana]
  );

  // State for characters - uses weighted selection for adaptive learning
  const [correctChar, setCorrectChar] = useState(() => {
    if (isReverse) {
      if (selectedRomaji.length === 0) return '';
      const selected = adaptiveSelector.selectWeightedCharacter(selectedRomaji);
      adaptiveSelector.markCharacterSeen(selected);
      return selected;
    } else {
      if (selectedKana.length === 0) return '';
      const selected = adaptiveSelector.selectWeightedCharacter(selectedKana);
      adaptiveSelector.markCharacterSeen(selected);
      return selected;
    }
  });

  const targetChar = selectedPairs[correctChar];

  useEffect(() => {
    if (inputRef.current && bottomBarState === 'check') {
      inputRef.current.focus();
    }
  }, [bottomBarState]);

  // Keyboard shortcut for Enter/Space to trigger button
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isEnter = (event.ctrlKey || event.metaKey) && event.key === 'Enter';
      const isSpace = event.code === 'Space' || event.key === ' ';

      if (isEnter) {
        if (bottomBarState !== 'check') {
          buttonRef.current?.click();
        }
      } else if (isSpace) {
        // Only trigger button for continue state.
        // If it's 'wrong', user might be trying to type a space to fix their answer.
        if (bottomBarState === 'correct') {
          event.preventDefault();
          buttonRef.current?.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bottomBarState]);

  useEffect(() => {
    if (isHidden) speedStopwatch.pause();
  }, [isHidden]);

  if (
    (isReverse && (!selectedRomaji || selectedRomaji.length === 0)) ||
    (!isReverse && (!selectedKana || selectedKana.length === 0))
  ) {
    return null;
  }

  const generateNewCharacter = () => {
    const sourceArray = isReverse ? selectedRomaji : selectedKana;
    // Use weighted selection - prioritizes characters user struggles with
    const newChar = adaptiveSelector.selectWeightedCharacter(
      sourceArray,
      correctChar
    );
    adaptiveSelector.markCharacterSeen(newChar);
    setCorrectChar(newChar);
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Enter' &&
      inputValue.trim().length &&
      bottomBarState !== 'correct'
    ) {
      handleCheck();
    }
  };

  const handleCheck = () => {
    if (inputValue.trim().length === 0) return;

    const trimmedInput = inputValue.trim();
    const isCorrect = isReverse
      ? trimmedInput === targetChar
      : trimmedInput.toLowerCase() === targetChar ||
        trimmedInput === correctChar;

    playClick();

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer(trimmedInput);
    }
  };

  const handleCorrectAnswer = () => {
    speedStopwatch.pause();
    const answerTimeMs = speedStopwatch.totalMilliseconds;
    addCorrectAnswerTime(answerTimeMs / 1000);
    // Track answer time for speed achievements (Requirements 6.1-6.5)
    recordAnswerTime(answerTimeMs);
    speedStopwatch.reset();
    playCorrect();
    addCharacterToHistory(correctChar);
    incrementCharacterScore(correctChar, 'correct');
    incrementCorrectAnswers();
    setScore(score + 1);

    triggerCrazyMode();
    // Update adaptive weight system - reduces probability of mastered characters
    adaptiveSelector.updateCharacterWeight(correctChar, true);
    // Track content-specific stats for achievements (Requirements 1.1-1.8)
    if (isHiragana(correctChar)) {
      incrementHiraganaCorrect();
    } else if (isKatakana(correctChar)) {
      incrementKatakanaCorrect();
    }
    // Reset wrong streak on correct answer (Requirement 10.2)
    resetWrongStreak();
    setBottomBarState('correct');
  };

  const handleWrongAnswer = (wrongInput: string) => {
    setLastWrongInput(wrongInput);
    setInputValue('');
    playErrorTwice();

    incrementCharacterScore(correctChar, 'wrong');
    incrementWrongAnswers();
    if (score - 1 < 0) {
      setScore(0);
    } else {
      setScore(score - 1);
    }
    triggerCrazyMode();
    // Update adaptive weight system - increases probability of difficult characters
    adaptiveSelector.updateCharacterWeight(correctChar, false);
    // Track wrong streak for achievements (Requirement 10.2)
    incrementWrongStreak();
    setBottomBarState('wrong');
  };

  const handleContinue = useCallback(() => {
    playClick();
    setInputValue('');
    generateNewCharacter();
    setBottomBarState('check');
    speedStopwatch.reset();
    speedStopwatch.start();
  }, [playClick]);

  const gameMode = isReverse ? 'reverse input' : 'input';
  const canCheck = inputValue.trim().length > 0 && bottomBarState !== 'correct';
  const showContinue = bottomBarState === 'correct';
  const showFeedback = bottomBarState !== 'check';

  return (
    <div
      className={clsx(
        'flex w-full flex-col items-center gap-4 sm:w-4/5 sm:gap-10',
        isHidden ? 'hidden' : ''
      )}
    >
      <GameIntel gameMode={gameMode} />
      <div className='flex flex-row items-center gap-1'>
        <motion.p
          className='text-8xl font-medium sm:text-9xl'
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 20,
            mass: 1,
            duration: 0.5
          }}
          key={correctChar}
        >
          {correctChar}
        </motion.p>
      </div>
      <textarea
        ref={inputRef as any}
        value={inputValue}
        placeholder='Type your answer...'
        disabled={showContinue}
        rows={2}
        className={clsx(
          'w-full max-w-xs sm:max-w-sm md:max-w-md',
          'rounded-2xl px-5 py-4',
          'rounded-2xl border-1 border-[var(--border-color)] bg-[var(--card-color)]',
          'text-top text-left text-lg font-medium lg:text-xl',
          'text-[var(--secondary-color)] placeholder:text-base placeholder:font-normal placeholder:text-[var(--secondary-color)]/40',
          'resize-none focus:outline-none',
          'transition-colors duration-200 ease-out',
          showContinue && 'cursor-not-allowed opacity-60'
        )}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleEnter(e as any);
          }
        }}
      />
      <Stars />

      {/* Bottom Bar - min-h-20 prevents layout jank when buttons are pressed */}
      <div
        className={clsx(
          'right-0 left-0 w-full',
          'border-t-2 border-[var(--border-color)] bg-[var(--card-color)]',
          'absolute bottom-0 z-10 px-2 py-2 sm:py-3 md:bottom-6 md:px-12 md:pt-2 md:pb-4',
          'flex min-h-20 flex-row items-center justify-center'
        )}
      >
        {/* Left Container: 50% width, aligned right */}
        <div className='flex w-1/2 items-center justify-center'>
          <div
            className={clsx(
              'flex items-center gap-2 transition-all duration-500 sm:gap-3 md:gap-4',
              showFeedback
                ? 'translate-x-0 opacity-100'
                : 'pointer-events-none -translate-x-4 opacity-0 sm:-translate-x-8'
            )}
          >
            {bottomBarState === 'correct' ? (
              <CircleCheck className='h-10 w-10 text-[var(--main-color)] sm:h-12 sm:w-12' />
            ) : (
              <CircleX className='h-10 w-10 text-[var(--main-color)] sm:h-12 sm:w-12' />
            )}
            <div className='flex flex-col'>
              <span
                className={clsx(
                  'text-lg sm:text-2xl',
                  'text-[var(--secondary-color)]'
                )}
              >
                {bottomBarState === 'correct'
                  ? 'Nicely done!'
                  : 'Wrong! Correct answer:'}
              </span>
              <span className='text-sm text-[var(--main-color)] sm:text-lg'>
                {targetChar}
              </span>
            </div>
          </div>
        </div>

        {/* Right Container: 50% width */}
        <div className='flex w-1/2 flex-row items-end justify-center gap-3'>
          {/* Fixed-height wrapper prevents layout shift when button is pressed */}
          <div className='flex h-[68px] items-end sm:h-[72px]'>
            <ActionButton
              ref={buttonRef}
              borderBottomThickness={12}
              borderRadius='3xl'
              className={clsx(
                'w-auto px-6 py-2.5 text-lg font-medium transition-all duration-150 sm:px-12 sm:py-3 sm:text-xl',
                !canCheck && !showContinue && 'cursor-default opacity-60'
              )}
              onClick={showContinue ? handleContinue : handleCheck}
            >
              <span className='max-sm:hidden'>
                {showContinue ? 'continue' : 'check'}
              </span>
              {showContinue ? (
                <CircleArrowRight className='h-8 w-8' />
              ) : (
                <CircleCheck className='h-8 w-8' />
              )}
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className='h-32' />
    </div>
  );
};

export default InputGame;
