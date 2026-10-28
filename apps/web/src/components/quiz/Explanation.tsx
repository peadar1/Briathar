import type { CellResult } from '@briathra/shared';
import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Explanation({ result }: { result: CellResult }) {
  const { t } = useTranslation();
  const steps = result.steps.filter((s) => s.code !== 'alternatives');
  const alternatives = result.accepted.filter((a) => a !== result.accepted[0]);

  return (
    <div className="rounded-xl border border-line bg-surface-muted/60 p-4 text-left">
      <p className="text-sm text-ink-muted">{t('quiz.answerWas')}</p>
      <p lang="ga" className="font-serif text-2xl font-semibold text-ink">
        {result.accepted[0]}
      </p>
      {alternatives.length > 0 && (
        <p lang="ga" className="mt-1 text-sm text-ink-muted">
          = {alternatives.join(' · ')}
        </p>
      )}
      <div className="mt-4 flex items-start gap-2">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <div>
          <p className="text-sm font-semibold">{t('quiz.why')}</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm text-ink-muted marker:text-ink-muted/60">
            {steps.map((step, i) => (
              <li key={i}>{step.text}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
