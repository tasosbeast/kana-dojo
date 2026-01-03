'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CircleCheck, CircleX, CircleArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import useKanjiStore, { IKanjiObj } from '@/features/Kanji/store/useKanjiStore';
import { useClick, useCorrect, useError } from '@/shared/hooks/useAudio';
import GameIntel from '@/shared/components/Game/GameIntel';
import { useStopwatch } from 'react-timer-hook';
import useStats from '@/shared/hooks/useStats';
import useStatsStore from '@/features/Progress/store/useStatsStore';
import { useShallow } from 'zustand/react/shallow';
import Stars from '@/shared/components/Game/Stars';
import AnswerSummary from '@/shared/components/Game/AnswerSummary';
import SSRAudioButton from '@/shared/components/audio/SSRAudioButton';
import FuriganaText from '@/shared/components/text/FuriganaText';
import { useCrazyModeTrigger } from '@/features/CrazyMode/hooks/useCrazyModeTrigger';
import { getGlobalAdaptiveSelector } from '@/shared/lib/adaptiveSelection';
import { ActionButton } from '@/shared/components/ui/ActionButton';

// Get the global adaptive selector for weighted character selection
const adaptiveSelector = getGlobalAdaptiveSelector();

// Bottom bar states
type BottomBarState = 'check' | 'correct' | 'wrong';

interface KanjiInputGameProps {
  selectedKanjiObjs: IKanjiObj[];
  isHidden: boolean;
  isReverse?: boolean;
}

const KanjiInputGame = ({
  selectedKanjiObjs,
  isHidden,
  isReverse = false
}: KanjiInputGameProps) => {
  // Get the current JLPT level from the Kanji store
  const selectedKanjiCollection = useKanjiStore(
    state => state.selectedKanjiCollection
  );

  const {
    score,
    setScore,
    incrementKanjiCorrect,
    recordAnswerTime,
    incrementWrongStreak,
    resetWrongStreak
  } = useStatsStore(
    useShallow(state => ({
      score: state.score,
      setScore: state.setScore,
      incrementKanjiCorrect: state.incrementKanjiCorrect,
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

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [inputValue, setInputValue] = useState('');
  const [bottomBarState, setBottomBarState] = useState<BottomBarState>('check');

  // State management based on mode - uses weighted selection for adaptive learning
  const [correctChar, setCorrectChar] = useState(() => {
    if (selectedKanjiObjs.length === 0) return '';
    const sourceArray = isReverse
      ? selectedKanjiObjs.map(obj => obj.meanings[0])
      : selectedKanjiObjs.map(obj => obj.kanjiChar);
    const selected = adaptiveSelector.selectWeightedCharacter(sourceArray);
    adaptiveSelector.markCharacterSeen(selected);
    return selected;
  });

  // Find the target character/meaning based on mode
  const correctKanjiObj = isReverse
    ? selectedKanjiObjs.find(obj => obj.meanings[0] === correctChar)
    : selectedKanjiObjs.find(obj => obj.kanjiChar === correctChar);

  const [currentKanjiObj, setCurrentKanjiObj] = useState<IKanjiObj>(
    correctKanjiObj as IKanjiObj
  );

  const targetChar = isReverse
    ? correctKanjiObj?.kanjiChar
    : [
        ...(correctKanjiObj?.meanings ?? []),
        ...(correctKanjiObj?.kunyomi?.map(k => k.split(' ')[0]) ?? []),
        ...(correctKanjiObj?.onyomi?.map(k => k.split(' ')[0]) ?? [])
      ];

  const [displayAnswerSummary, setDisplayAnswerSummary] = useState(false);

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

  if (!selectedKanjiObjs || selectedKanjiObjs.length === 0) {
    return null;
  }

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === 'Enter' &&
      inputValue.trim().length &&
      bottomBarState !== 'correct'
    ) {
      handleCheck();
    }
  };

  const isInputCorrect = (input: string): boolean => {
    if (!isReverse) {
      return (
        Array.isArray(targetChar) &&
        targetChar.includes(input.trim().toLowerCase())
      );
    } else {
      return input.trim().toLowerCase() === targetChar;
    }
  };

  const handleCheck = () => {
    if (inputValue.trim().length === 0) return;
    const trimmedInput = inputValue.trim();

    playClick();

    if (isInputCorrect(trimmedInput)) {
      handleCorrectAnswer(trimmedInput);
    } else {
      handleWrongAnswer();
    }
  };

  const handleCorrectAnswer = (userInput: string) => {
    speedStopwatch.pause();
    const answerTimeMs = speedStopwatch.totalMilliseconds;
    addCorrectAnswerTime(answerTimeMs / 1000);
    recordAnswerTime(answerTimeMs);
    speedStopwatch.reset();
    setCurrentKanjiObj(correctKanjiObj as IKanjiObj);

    playCorrect();
    addCharacterToHistory(correctChar);
    incrementCharacterScore(correctChar, 'correct');
    incrementCorrectAnswers();
    setScore(score + 1);

    triggerCrazyMode();
    adaptiveSelector.updateCharacterWeight(correctChar, true);
    incrementKanjiCorrect(selectedKanjiCollection.toUpperCase());
    resetWrongStreak();
    setBottomBarState('correct');
    setDisplayAnswerSummary(true);
  };

  const handleWrongAnswer = () => {
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
    adaptiveSelector.updateCharacterWeight(correctChar, false);
    incrementWrongStreak();
    setBottomBarState('wrong');
  };

  const generateNewCharacter = () => {
    const sourceArray = isReverse
      ? selectedKanjiObjs.map(obj => obj.meanings[0])
      : selectedKanjiObjs.map(obj => obj.kanjiChar);

    const newChar = adaptiveSelector.selectWeightedCharacter(
      sourceArray,
      correctChar
    );
    adaptiveSelector.markCharacterSeen(newChar);
    setCorrectChar(newChar);
  };

  const handleContinue = useCallback(() => {
    playClick();
    setInputValue('');
    setDisplayAnswerSummary(false);
    generateNewCharacter();
    setBottomBarState('check');
    speedStopwatch.reset();
    speedStopwatch.start();
  }, [playClick]);

  const gameMode = isReverse ? 'reverse input' : 'input';
  const displayCharLang = isReverse ? 'en' : 'ja';
  const inputLang = isReverse ? 'ja' : 'en';
  const textSize = isReverse ? 'text-6xl sm:text-8xl' : 'text-8xl sm:text-9xl';
  const gapSize = isReverse ? 'gap-6 sm:gap-10' : 'gap-4 sm:gap-10';
  const canCheck = inputValue.trim().length > 0 && bottomBarState !== 'correct';
  const showContinue = bottomBarState === 'correct';
  const showFeedback = bottomBarState !== 'check';

  // For Bottom Bar feedback
  const feedbackText = isReverse
    ? targetChar
    : Array.isArray(targetChar)
      ? targetChar[0]
      : targetChar;

  return (
    <div
      className={clsx(
        'flex w-full flex-col items-center sm:w-4/5',
        gapSize,
        isHidden ? 'hidden' : ''
      )}
    >
      <GameIntel gameMode={gameMode} />

      {displayAnswerSummary ? (
        <AnswerSummary
          payload={currentKanjiObj}
          setDisplayAnswerSummary={setDisplayAnswerSummary}
          feedback={<></>}
          isEmbedded={true}
        />
      ) : (
        <>
          <div className='flex flex-row items-center gap-1'>
            <motion.div
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
              className='flex flex-row items-center gap-1'
            >
              <FuriganaText
                text={correctChar}
                reading={
                  !isReverse
                    ? correctKanjiObj?.onyomi[0] || correctKanjiObj?.kunyomi[0]
                    : undefined
                }
                className={textSize}
                lang={displayCharLang}
              />
              {!isReverse && (
                <SSRAudioButton
                  text={correctChar}
                  variant='icon-only'
                  size='sm'
                  className='bg-[var(--card-color)] text-[var(--secondary-color)]'
                />
              )}
            </motion.div>
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
            lang={inputLang}
          />
        </>
      )}

      <Stars />

      {/* Bottom Bar */}
      <div
        className={clsx(
          'right-0 left-0 w-full',
          'border-t-2 border-[var(--border-color)] bg-[var(--card-color)]',
          'absolute bottom-0 z-10 px-2 py-2 sm:py-3 md:bottom-6 md:px-12 md:pt-2 md:pb-4',
          'flex min-h-20 flex-row items-center justify-center'
        )}
      >
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
              <span className='text-lg text-[var(--secondary-color)] sm:text-2xl'>
                {bottomBarState === 'correct'
                  ? 'Nicely done!'
                  : 'Wrong! Correct answer:'}
              </span>
              <span className='text-sm text-[var(--main-color)] sm:text-lg'>
                {feedbackText}
              </span>
            </div>
          </div>
        </div>

        <div className='flex w-1/2 flex-row items-end justify-center gap-3'>
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

      <div className='h-32' />
    </div>
  );
};

export default KanjiInputGame;
