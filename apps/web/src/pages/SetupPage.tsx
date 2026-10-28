import {
  FORM_LABELS,
  LEXICON,
  PERSONS,
  PERSON_LABELS,
  SENTENCE_FORMS,
  TENSES,
  TENSE_LABELS,
  type Conjugation,
} from '@briathra/conjugator';
import {
  PRESETS,
  QUESTION_COUNTS,
  TIMED_DURATIONS,
  getPreset,
  type CreateSessionRequest,
  type QuizConfig,
  type QuizMode,
} from '@briathra/shared';
import { Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Chip } from '../components/ui/chip';
import { Segmented } from '../components/ui/segmented';
import { api } from '../lib/api';
import { sessionStore } from '../lib/session-store';
import { useSettings } from '../lib/settings';
import { cn } from '../lib/utils';

type ModeKind = QuizMode['kind'];

const GROUPS: { conjugation: Conjugation; labelKey: 'setup.irregular' | 'setup.first' | 'setup.second' }[] = [
  { conjugation: 'irregular', labelKey: 'setup.irregular' },
  { conjugation: 1, labelKey: 'setup.first' },
  { conjugation: 2, labelKey: 'setup.second' },
];

function toggle<T>(list: readonly T[], item: T, on: boolean): T[] {
  return on ? [...new Set([...list, item])] : list.filter((x) => x !== item);
}

function initialRequest(state: unknown, presetId: string | null): { config: QuizConfig; mode?: QuizMode } {
  const fromState = (state as { request?: CreateSessionRequest } | null)?.request;
  if (fromState) return fromState;
  return { config: (getPreset(presetId ?? '') ?? PRESETS[0]!).config };
}

export function SetupPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const presetId = params.get('preset');
  const preset = presetId ? getPreset(presetId) : undefined;
  const { settings, update } = useSettings();
  const showEnglish = i18n.language === 'en';

  const [initial] = useState(() => initialRequest(location.state, presetId));
  const [lemmas, setLemmas] = useState<string[]>(initial.config.lemmas);
  const [tenses, setTenses] = useState(initial.config.tenses);
  const [forms, setForms] = useState(initial.config.forms);
  const [persons, setPersons] = useState(initial.config.persons);
  const [modeKind, setModeKind] = useState<ModeKind>(initial.mode?.kind ?? 'timed');
  const [durationSec, setDurationSec] = useState<(typeof TIMED_DURATIONS)[number]>(
    initial.mode?.kind === 'timed' ? initial.mode.durationSec : 120,
  );
  const [questionCount, setQuestionCount] = useState<(typeof QUESTION_COUNTS)[number]>(
    initial.mode && 'questionCount' in initial.mode ? initial.mode.questionCount : 20,
  );
  const [search, setSearch] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config: QuizConfig = { lemmas, tenses, forms, persons };
  const valid = lemmas.length > 0 && tenses.length > 0 && forms.length > 0 && persons.length > 0;
  const matchesPreset = preset && JSON.stringify(preset.config) === JSON.stringify(config);

  const buildMode = (): QuizMode => {
    switch (modeKind) {
      case 'timed':
        return { kind: 'timed', durationSec };
      case 'fixed':
        return { kind: 'fixed', questionCount };
      case 'table':
        return { kind: 'table', questionCount };
      case 'practice':
        return { kind: 'practice' };
    }
  };

  const start = async () => {
    if (!valid) return setError(t('setup.invalid'));
    setStarting(true);
    setError(null);
    const request: CreateSessionRequest = {
      config,
      mode: buildMode(),
      strictFadas: settings.strictFadas,
      ...(matchesPreset ? { presetId: preset.id } : {}),
    };
    try {
      sessionStore.start(await api.createSession(request), request);
      navigate('/quiz');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setStarting(false);
    }
  };

  const query = search.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">{t('setup.title')}</h1>
        {preset && (
          <p className="mt-1 text-ink-muted">
            <span lang="ga">{preset.title.ga}</span>
            {showEnglish && <> · {preset.title.en}</>}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Section title={t('setup.verbs')} aside={t('setup.selected', { count: lemmas.length })}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('setup.search')}
                aria-label={t('setup.search')}
                className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div className="mt-4 space-y-5">
              {GROUPS.map(({ conjugation, labelKey }) => {
                const verbs = LEXICON.filter(
                  (v) =>
                    v.conjugation === conjugation &&
                    (!query || v.lemma.includes(query) || v.en[0].toLowerCase().includes(query)),
                );
                if (verbs.length === 0) return null;
                const groupLemmas = verbs.map((v) => v.lemma);
                return (
                  <div key={String(conjugation)}>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{t(labelKey)}</h3>
                      <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => setLemmas((l) => [...new Set([...l, ...groupLemmas])])}
                      >
                        {t('setup.selectAll')}
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-ink-muted hover:underline"
                        onClick={() => setLemmas((l) => l.filter((x) => !groupLemmas.includes(x)))}
                      >
                        {t('setup.clear')}
                      </button>
                    </div>
                    <div className={cn('flex flex-wrap gap-1.5', conjugation !== 'irregular' && 'max-h-44 overflow-y-auto pr-1')}>
                      {verbs.map((verb) => (
                        <Chip
                          key={verb.lemma}
                          lang="ga"
                          checked={lemmas.includes(verb.lemma)}
                          onChange={(on) => setLemmas((l) => toggle(l, verb.lemma, on))}
                        >
                          <span title={verb.en[0]}>{verb.lemma}</span>
                        </Chip>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title={t('setup.tenses')}>
            <ChipGroup
              items={TENSES}
              selected={tenses}
              onChange={setTenses}
              label={(x) => TENSE_LABELS[x].ga.replace(/^An /, '')}
              hint={(x) => (showEnglish ? TENSE_LABELS[x].en : undefined)}
            />
          </Section>
          <Section title={t('setup.forms')}>
            <ChipGroup
              items={SENTENCE_FORMS}
              selected={forms}
              onChange={setForms}
              label={(x) => FORM_LABELS[x].ga}
              hint={(x) => (showEnglish ? FORM_LABELS[x].en : undefined)}
            />
          </Section>
          <Section title={t('setup.persons')}>
            <ChipGroup
              items={PERSONS}
              selected={persons}
              onChange={setPersons}
              label={(x) => PERSON_LABELS[x].ga}
              hint={(x) => (showEnglish ? PERSON_LABELS[x].en : undefined)}
            />
          </Section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Section title={t('setup.mode')}>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('setup.mode')}>
              {(['timed', 'fixed', 'practice', 'table'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={modeKind === kind}
                  onClick={() => setModeKind(kind)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-colors',
                    modeKind === kind ? 'border-primary bg-primary-soft' : 'border-line hover:border-ink-muted/40',
                  )}
                >
                  <span className="block text-sm font-semibold">{t(`setup.modes.${kind}`)}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-ink-muted">{t(`setup.modes.${modeKind}Desc`)}</p>

            {modeKind === 'timed' && (
              <Segmented
                className="mt-3"
                label={t('setup.duration')}
                value={durationSec}
                onChange={setDurationSec}
                options={TIMED_DURATIONS.map((d) => ({ value: d, label: t('setup.minutes', { count: d / 60 }) }))}
              />
            )}
            {(modeKind === 'fixed' || modeKind === 'table') && (
              <Segmented
                className="mt-3"
                label={t('setup.questions')}
                value={questionCount}
                onChange={setQuestionCount}
                options={QUESTION_COUNTS.map((n) => ({ value: n, label: String(n) }))}
              />
            )}
          </Section>

          <Section title={t('setup.fadas')}>
            <Segmented
              label={t('setup.fadas')}
              value={settings.strictFadas ? 'strict' : 'lenient'}
              onChange={(v) => update({ strictFadas: v === 'strict' })}
              options={[
                { value: 'strict', label: t('setup.strict') },
                { value: 'lenient', label: t('setup.lenient') },
              ]}
            />
            <p className="mt-2 text-sm text-ink-muted">
              {settings.strictFadas ? t('setup.strictHint') : t('setup.lenientHint')}
            </p>
          </Section>

          {modeKind !== 'table' && (
            <Section title={t('setup.prompt')}>
              <Segmented
                label={t('setup.prompt')}
                value={settings.promptType}
                onChange={(promptType) => update({ promptType })}
                options={[
                  { value: 'grammar', label: t('setup.grammar') },
                  { value: 'english', label: t('setup.english') },
                ]}
              />
              <p lang="ga" className="mt-2 text-sm text-ink-muted">
                {settings.promptType === 'grammar' ? t('setup.grammarHint') : t('setup.englishHint')}
              </p>
            </Section>
          )}

          <div>
            <Button size="lg" className="w-full" onClick={() => void start()} disabled={starting}>
              {starting ? t('setup.starting') : t('setup.start')}
            </Button>
            {error && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">{title}</h2>
        {aside && <span className="text-sm text-ink-muted">{aside}</span>}
      </div>
      {children}
    </Card>
  );
}

function ChipGroup<T extends string>({
  items,
  selected,
  onChange,
  label,
  hint,
}: {
  items: readonly T[];
  selected: T[];
  onChange: (next: T[]) => void;
  label: (item: T) => string;
  hint: (item: T) => string | undefined;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Chip key={item} lang="ga" checked={selected.includes(item)} onChange={(on) => onChange(toggle(selected, item, on))}>
          {label(item)}
          {hint(item) && <span className="text-xs text-ink-muted">· {hint(item)}</span>}
        </Chip>
      ))}
    </div>
  );
}
