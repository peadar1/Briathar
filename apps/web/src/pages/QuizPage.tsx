import { Clock, Flag } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { SingleQuestion } from '../components/quiz/SingleQuestion';
import { TableQuestion } from '../components/quiz/TableQuestion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useQuiz } from '../hooks/useQuiz';
import { sessionStore, type ActiveQuiz } from '../lib/session-store';
import { useSettings } from '../lib/settings';
import { cn, formatClock } from '../lib/utils';

export function QuizPage() {
  const active = useMemo(() => sessionStore.active(), []);
  if (!active) return <Navigate to="/" replace />;
  return <QuizRunner initial={active} />;
}

function QuizRunner({ initial }: { initial: ActiveQuiz }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const quiz = useQuiz(initial);
  const { session, question, index, score, remainingSec, elapsedSec } = quiz;
  const mode = session.mode;
  const total = mode.kind === 'fixed' || mode.kind === 'table' ? mode.questionCount : null;
  const lowTime = remainingSec !== null && remainingSec <= 10;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-4">
          <Stat label={t('quiz.score')}>
            <span className="text-primary">{score.correct}</span>
            <span className="text-ink-muted"> / {score.attempted}</span>
          </Stat>
          {total !== null && (
            <span className="text-ink-muted">{t('quiz.progress', { n: Math.min(index + 1, total), total })}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Stat label={remainingSec !== null ? t('quiz.timeLeft') : t('quiz.elapsed')}>
            <span className={cn('inline-flex items-center gap-1 tabular-nums', lowTime && 'text-danger')}>
              <Clock className="size-4" aria-hidden />
              {formatClock(remainingSec ?? elapsedSec)}
            </span>
          </Stat>
          {(mode.kind === 'practice' || mode.kind === 'timed') && (
            <Button variant="ghost" size="sm" onClick={() => void quiz.finish()}>
              <Flag aria-hidden />
              {t('quiz.end')}
            </Button>
          )}
        </div>
      </div>

      {total !== null && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(index / total) * 100}%` }} />
        </div>
      )}
      {remainingSec !== null && mode.kind === 'timed' && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
          <div
            className={cn('h-full rounded-full transition-[width] duration-300 ease-linear', lowTime ? 'bg-danger' : 'bg-accent')}
            style={{ width: `${Math.max(0, remainingSec / mode.durationSec) * 100}%` }}
          />
        </div>
      )}

      <Card className="p-6 sm:p-8">
        {quiz.error && (
          <p role="alert" className="mb-4 text-sm text-danger">
            {quiz.error}
          </p>
        )}
        {!question ? (
          <p className="py-12 text-center text-ink-muted">{t('common.loading')}</p>
        ) : mode.kind === 'table' ? (
          <TableQuestion key={question.id} question={question} onSubmit={quiz.submit} onAdvance={quiz.advance} />
        ) : (
          <SingleQuestion
            key={question.id}
            question={question}
            promptType={settings.promptType}
            strictFadas={session.strictFadas}
            onSubmit={quiz.submit}
            onAdvance={quiz.advance}
          />
        )}
      </Card>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-ink-muted">{label}</span>
      <span className="text-base font-semibold">{children}</span>
    </span>
  );
}
