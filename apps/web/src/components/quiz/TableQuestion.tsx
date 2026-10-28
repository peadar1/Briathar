import { FORM_LABELS, PERSON_LABELS, TENSE_LABELS, getVerb, type Person } from '@briathra/conjugator';
import type { AnswerResultDto, CellResult, QuestionDto } from '@briathra/shared';
import { CircleCheck, CircleX } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { FadaInput } from './FadaInput';

export function TableQuestion({
  question,
  onSubmit,
  onAdvance,
}: {
  question: QuestionDto;
  onSubmit: (answers: Record<string, string>) => Promise<AnswerResultDto | null>;
  onAdvance: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [values, setValues] = useState<Partial<Record<Person, string>>>({});
  const [results, setResults] = useState<CellResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const nextButton = useRef<HTMLButtonElement>(null);
  const showEnglish = i18n.language === 'en';

  useEffect(() => {
    inputs.current[0]?.focus({ preventScroll: true });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (results) return onAdvance();
    setBusy(true);
    try {
      const response = await onSubmit(
        Object.fromEntries(question.persons.map((p) => [p, values[p] ?? ''])),
      );
      if (response) {
        setResults(response.results);
        requestAnimationFrame(() => nextButton.current?.focus());
      }
    } finally {
      setBusy(false);
    }
  };

  const focusNext = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && index < question.persons.length - 1) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  };

  const tense = TENSE_LABELS[question.tense];
  const form = FORM_LABELS[question.form];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-ink-muted">{t('quiz.tableTitle')}</p>
        <p lang="ga" className="mt-2 font-serif text-4xl font-semibold">
          {question.lemma}
        </p>
        <p className="mt-1 text-ink-muted">“{getVerb(question.lemma)?.en[0]}”</p>
        <p className="mt-3 text-sm">
          <span lang="ga" className="font-medium">
            {tense.ga} · {form.ga}
          </span>
          {showEnglish && (
            <span className="text-ink-muted">
              {' '}
              ({tense.en}, {form.en.toLowerCase()})
            </span>
          )}
        </p>
      </div>

      <ol className="space-y-2">
        {question.persons.map((person, i) => {
          const result = results?.[i];
          const hint = result?.steps.find((s) => s.code === 'irregular' || s.code === 'mutation')?.text;
          return (
            <li key={person} className="grid grid-cols-[6.5rem_1fr] items-start gap-3">
              <label htmlFor={`cell-${person}`} className="min-w-0 break-words pt-3 text-right text-sm sm:text-base">
                <span lang="ga" className="block font-medium">
                  {PERSON_LABELS[person].ga}
                </span>
                {showEnglish && <span className="block text-xs text-ink-muted">{PERSON_LABELS[person].en}</span>}
              </label>
              <div>
                <FadaInput
                  id={`cell-${person}`}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  showKeys={false}
                  value={values[person] ?? ''}
                  onValueChange={(v) => setValues((s) => ({ ...s, [person]: v }))}
                  onKeyDown={focusNext(i)}
                  readOnly={!!results}
                  className={cn(
                    'h-12 text-base',
                    result?.correct && 'border-success bg-success-soft',
                    result && !result.correct && 'border-danger bg-danger-soft',
                  )}
                />
                {result && (
                  <p
                    className={cn(
                      'mt-1 flex items-center gap-1.5 text-sm',
                      result.correct ? 'text-success' : 'text-danger',
                    )}
                  >
                    {result.correct ? (
                      <CircleCheck className="size-4" aria-hidden />
                    ) : (
                      <CircleX className="size-4" aria-hidden />
                    )}
                    <span lang="ga">{result.correct ? result.expected : result.accepted[0]}</span>
                    {!result.correct && hint && <span className="text-ink-muted">· {hint}</span>}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <Button ref={nextButton} type="submit" size="lg" className="w-full" disabled={busy}>
        {results ? t('quiz.next') : t('quiz.checkTable')}
      </Button>
    </form>
  );
}
