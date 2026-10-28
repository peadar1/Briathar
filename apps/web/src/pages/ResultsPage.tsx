import { FORM_LABELS, PERSON_LABELS, TENSE_LABELS } from '@briathra/conjugator';
import { RotateCcw, SlidersHorizontal, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { api } from '../lib/api';
import { sessionStore } from '../lib/session-store';
import { formatClock } from '../lib/utils';

export function ResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const summary = useMemo(() => sessionStore.summary(), []);
  const lastRequest = useMemo(() => sessionStore.lastRequest(), []);
  const [restarting, setRestarting] = useState(false);

  if (!summary) return <Navigate to="/" replace />;

  const again = async () => {
    if (!lastRequest) return navigate('/setup');
    setRestarting(true);
    try {
      sessionStore.start(await api.createSession(lastRequest), lastRequest);
      navigate('/quiz');
    } catch {
      setRestarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="p-6 text-center sm:p-8">
        <Trophy className="mx-auto size-8 text-accent" aria-hidden />
        <h1 className="mt-2 font-serif text-3xl font-semibold">{t('results.title')}</h1>
        <dl className="mt-6 grid grid-cols-3 gap-4">
          <Metric label={t('results.score')} value={`${summary.score.correct} / ${summary.score.attempted}`} />
          <Metric label={t('results.accuracy')} value={`${Math.round(summary.accuracy * 100)}%`} />
          <Metric label={t('results.time')} value={formatClock(summary.durationSec)} />
        </dl>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => void again()} disabled={restarting}>
            <RotateCcw aria-hidden />
            {t('results.again')}
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/setup" state={{ request: lastRequest }}>
              <SlidersHorizontal aria-hidden />
              {t('results.change')}
            </Link>
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-xl font-semibold">{t('results.review')}</h2>
        {summary.missed.length === 0 ? (
          <p className="mt-3 text-success">{t('results.perfect')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {summary.missed.map((item, i) => (
              <li key={i} className="py-3">
                <p lang="ga" className="text-sm text-ink-muted">
                  <span className="font-semibold text-ink">{item.lemma}</span> ·{' '}
                  {TENSE_LABELS[item.tense].ga.replace(/^An /, '')} · {PERSON_LABELS[item.person].ga} ·{' '}
                  {FORM_LABELS[item.form].ga}
                </p>
                <div className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-ink-muted">{t('results.yourAnswer')}: </span>
                    <span lang="ga" className="text-danger line-through decoration-danger/50">
                      {item.given || t('results.blank')}
                    </span>
                  </p>
                  <p>
                    <span className="text-ink-muted">{t('results.answer')}: </span>
                    <span lang="ga" className="font-semibold text-success">
                      {item.expected}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted p-3">
      <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
