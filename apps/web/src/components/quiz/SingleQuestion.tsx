import { checkAnswer } from '@briathra/conjugator';
import type { AnswerResultDto, CellResult, PromptType, QuestionDto } from '@briathra/shared';
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, shake } from '../../lib/utils';
import { Button } from '../ui/button';
import { Explanation } from './Explanation';
import { FadaInput } from './FadaInput';
import { PromptCard } from './PromptCard';

type Phase = 'answering' | 'correct' | 'retype';

const ADVANCE_DELAY_MS = 700;
const ADVANCE_DELAY_WITH_WARNING_MS = 1800;

export function SingleQuestion({
  question,
  promptType,
  strictFadas,
  onSubmit,
  onAdvance,
}: {
  question: QuestionDto;
  promptType: PromptType;
  strictFadas: boolean;
  onSubmit: (answers: Record<string, string>) => Promise<AnswerResultDto | null>;
  onAdvance: () => void;
}) {
  const { t } = useTranslation();
  const person = question.persons[0]!;
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('answering');
  const [result, setResult] = useState<CellResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [retypeHint, setRetypeHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputWrapper = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearTimeout(advanceTimer.current);
  }, []);

  const send = async (answer: string) => {
    setBusy(true);
    try {
      const response = await onSubmit({ [person]: answer });
      const cell = response?.results[0];
      if (!cell) return;
      setResult(cell);
      if (cell.correct) {
        setPhase('correct');
        advanceTimer.current = setTimeout(
          onAdvance,
          cell.fadaWarning ? ADVANCE_DELAY_WITH_WARNING_MS : ADVANCE_DELAY_MS,
        );
      } else {
        setPhase('retype');
        setInput('');
        shake(inputWrapper.current);
      }
    } finally {
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (phase === 'correct') {
      clearTimeout(advanceTimer.current);
      onAdvance();
      return;
    }
    if (phase === 'retype' && result) {
      const check = checkAnswer(input, result.accepted, { strictFadas });
      if (check.correct) {
        onAdvance();
      } else {
        setRetypeHint(check.fadaOnly ? t('quiz.fadaOnly') : t('quiz.retype'));
        shake(inputWrapper.current);
      }
      return;
    }
    if (input.trim()) void send(input);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PromptCard question={question} person={person} promptType={promptType} />

      <div ref={inputWrapper}>
        <FadaInput
          ref={inputRef}
          value={input}
          onValueChange={setInput}
          readOnly={phase === 'correct'}
          disabled={busy}
          placeholder={phase === 'retype' ? result?.accepted[0] : t('quiz.placeholder')}
          aria-label={t('quiz.placeholder')}
          className={cn(
            phase === 'correct' && 'animate-pop border-success bg-success-soft focus:border-success focus:ring-success/25',
            phase === 'retype' && 'border-danger focus:border-danger focus:ring-danger/25',
          )}
        />
      </div>

      <div aria-live="polite" className="min-h-6">
        {phase === 'correct' && result && (
          <p className="flex items-center gap-2 font-medium text-success">
            <CircleCheck className="size-5" aria-hidden />
            {t('quiz.correct')}
            {result.fadaWarning && (
              <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-warning">
                <CircleAlert className="size-4" aria-hidden />
                {t('quiz.fadaWarning', { answer: result.expected })}
              </span>
            )}
          </p>
        )}
        {phase === 'retype' && result && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 font-medium text-danger">
              <CircleX className="size-5" aria-hidden />
              {result.fadaOnly ? t('quiz.fadaOnly') : t('quiz.incorrect')}
              <span className="text-sm font-normal text-ink-muted">{retypeHint ?? t('quiz.retype')}</span>
            </p>
            <Explanation result={result} />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="lg" className="flex-1" disabled={busy}>
          {phase === 'answering' ? t('quiz.check') : t('quiz.next')}
        </Button>
        {phase === 'answering' && (
          <Button type="button" size="lg" variant="secondary" disabled={busy} onClick={() => void send('')}>
            {t('quiz.reveal')}
          </Button>
        )}
      </div>
    </form>
  );
}
