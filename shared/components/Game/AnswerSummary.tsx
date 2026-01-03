import clsx from 'clsx';
import { toKana, toRomaji } from 'wanakana';
import { IKanjiObj } from '@/features/Kanji/store/useKanjiStore';
import { IVocabObj } from '@/features/Vocabulary/store/useVocabStore';
import { CircleArrowRight } from 'lucide-react';
import { Dispatch, SetStateAction, useRef, useEffect } from 'react';
import { useClick } from '@/shared/hooks/useAudio';
import FuriganaText from '@/shared/components/text/FuriganaText';
import usePreferencesStore from '@/features/Preferences/store/usePreferencesStore';
import { ActionButton } from '@/shared/components/ui/ActionButton';

// Type guard
const isKanjiObj = (obj: IKanjiObj | IVocabObj): obj is IKanjiObj => {
  return (obj as IKanjiObj).kanjiChar !== undefined;
};

// Sub-components
const FeedbackHeader = ({ feedback }: { feedback: React.ReactElement }) => (
  <p className='flex w-full items-center justify-center gap-1.5 border-t-1 border-b-1 border-[var(--border-color)] px-4 py-3 text-xl'>
    {feedback}
  </p>
);

const ContinueButton = ({
  buttonRef,
  onClick,
  disabled
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  disabled: boolean;
}) => {
  return (
    <div
      className={clsx(
        'w-[100vw]',
        'border-t-2 border-[var(--border-color)] bg-[var(--card-color)]',
        'absolute bottom-0 z-10 px-4 py-4 md:bottom-6',
        'flex items-center justify-center'
      )}
    >
      <ActionButton
        ref={buttonRef}
        borderBottomThickness={8}
        borderRadius='3xl'
        className='w-full px-16 py-4 text-xl md:w-1/2'
        onClick={onClick}
        disabled={disabled}
      >
        <span>continue</span>
        <CircleArrowRight />
      </ActionButton>
    </div>
  );
};

const KanjiDisplay = ({ payload }: { payload: IKanjiObj }) => (
  <div className='relative flex aspect-square w-full max-w-[100px] items-center justify-center'>
    {/* 4-segment square background */}
    <div className='absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-xl border-1 border-[var(--border-color)] bg-[var(--background-color)]'>
      <div className='border-r border-b border-[var(--border-color)]' />
      <div className='border-b border-[var(--border-color)]' />
      <div className='border-r border-[var(--border-color)]' />
      <div />
    </div>

    <FuriganaText
      text={payload.kanjiChar}
      reading={payload.onyomi[0] || payload.kunyomi[0]}
      className='relative z-10 pb-2 text-7xl'
      lang='ja'
    />
  </div>
);

const ReadingsList = ({
  readings,
  isHidden
}: {
  readings: string[];
  isHidden: boolean;
}) => {
  if (isHidden) return null;

  return (
    <div className='flex h-1/2 flex-row gap-2 rounded-2xl bg-[var(--card-color)]'>
      {readings.slice(0, 2).map((reading, i) => (
        <span
          key={reading}
          className={clsx(
            'flex flex-row items-center justify-center px-2 py-1 text-sm md:text-base',
            'w-full text-[var(--secondary-color)]',
            i < readings.slice(0, 2).length - 1 &&
              'border-r-1 border-[var(--border-color)]'
          )}
        >
          {reading}
        </span>
      ))}
    </div>
  );
};

const KanjiSummary = ({
  payload,
  feedback,
  onContinue,
  buttonRef,
  isEmbedded = false
}: {
  payload: IKanjiObj;
  feedback: React.ReactElement;
  onContinue: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  isEmbedded?: boolean;
}) => (
  <div className='flex w-full flex-col items-center justify-start gap-4 py-4 md:w-3/4 lg:w-1/2'>
    {!isEmbedded && <FeedbackHeader feedback={feedback} />}

    <div className='flex w-full flex-row gap-4'>
      <KanjiDisplay payload={payload} />

      <div className='flex w-full flex-col gap-2'>
        <ReadingsList
          readings={payload.onyomi}
          isHidden={!payload.onyomi[0] || payload.onyomi.length === 0}
        />
        <ReadingsList
          readings={payload.kunyomi}
          isHidden={!payload.kunyomi[0] || payload.kunyomi.length === 0}
        />
      </div>
    </div>

    <p className='w-full text-xl text-[var(--secondary-color)] md:text-2xl'>
      {payload.fullDisplayMeanings.join(', ')}
    </p>

    {!isEmbedded && (
      <ContinueButton
        buttonRef={buttonRef}
        onClick={onContinue}
        disabled={false}
      />
    )}
  </div>
);

const VocabSummary = ({
  payload,
  feedback,
  onContinue,
  buttonRef,
  isEmbedded = false
}: {
  payload: IVocabObj;
  feedback: React.ReactElement;
  onContinue: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  isEmbedded?: boolean;
}) => {
  const showKana = usePreferencesStore(state => state.displayKana);
  const rawReading = payload.reading || '';
  const baseReading = rawReading.split(' ')[1] || rawReading;
  const displayReading = showKana ? toKana(baseReading) : toRomaji(baseReading);

  return (
    <div className='flex w-full flex-col items-center justify-start gap-4 py-4 md:w-3/4 lg:w-1/2'>
      {!isEmbedded && <FeedbackHeader feedback={feedback} />}

      <FuriganaText
        text={payload.word}
        reading={payload.reading}
        className='flex w-full justify-center text-6xl'
        lang='ja'
      />

      <div className='flex w-full flex-col items-start gap-2'>
        <span
          className={clsx(
            'flex flex-row items-center rounded-xl px-2 py-1',
            'bg-[var(--card-color)] text-lg',
            'text-[var(--secondary-color)]'
          )}
        >
          {displayReading}
        </span>
        <p className='text-xl text-[var(--secondary-color)] md:text-2xl'>
          {payload.displayMeanings.join(', ')}
        </p>
      </div>

      {!isEmbedded && (
        <ContinueButton
          buttonRef={buttonRef}
          onClick={onContinue}
          disabled={false}
        />
      )}
    </div>
  );
};

// Main component
const AnswerSummary = ({
  payload,
  setDisplayAnswerSummary,
  feedback,
  isEmbedded = false
}: {
  payload: IKanjiObj | IVocabObj;
  setDisplayAnswerSummary: Dispatch<SetStateAction<boolean>>;
  feedback: React.ReactElement;
  isEmbedded?: boolean;
}) => {
  const { playClick } = useClick();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        // event.key === 'Enter' ||
        ((event.ctrlKey || event.metaKey) && event.key === 'Enter') ||
        event.code === 'Space' ||
        event.key === ' '
      ) {
        buttonRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleContinue = () => {
    playClick();
    setDisplayAnswerSummary(false);
  };

  return isKanjiObj(payload) ? (
    <KanjiSummary
      key={payload.id}
      payload={payload}
      feedback={feedback}
      onContinue={handleContinue}
      buttonRef={buttonRef}
      isEmbedded={isEmbedded}
    />
  ) : (
    <VocabSummary
      key={payload.word}
      payload={payload}
      feedback={feedback}
      onContinue={handleContinue}
      buttonRef={buttonRef}
      isEmbedded={isEmbedded}
    />
  );
};

export default AnswerSummary;
