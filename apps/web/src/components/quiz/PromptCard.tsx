import { FORM_LABELS, PERSON_LABELS, TENSE_LABELS, getVerb, type Person } from '@briathra/conjugator';
import type { PromptType, QuestionDto } from '@briathra/shared';
import { useTranslation } from 'react-i18next';

function Tag({ ga, en, showEnglish }: { ga: string; en: string; showEnglish: boolean }) {
  return (
    <span className="inline-flex flex-col items-center rounded-lg bg-surface-muted px-3 py-1.5">
      <span lang="ga" className="text-sm font-medium text-ink">
        {ga}
      </span>
      {showEnglish && <span className="text-[0.7rem] text-ink-muted">{en}</span>}
    </span>
  );
}

export function PromptCard({
  question,
  person,
  promptType,
}: {
  question: QuestionDto;
  person: Person;
  promptType: PromptType;
}) {
  const { t, i18n } = useTranslation();
  const showEnglish = i18n.language === 'en';
  const gloss = getVerb(question.lemma)?.en[0];
  const tense = TENSE_LABELS[question.tense];
  const form = FORM_LABELS[question.form];
  const personLabel = PERSON_LABELS[person];

  if (promptType === 'english') {
    const sentence = question.english[question.persons.indexOf(person)] ?? '';
    return (
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-ink-muted">{t('quiz.translate')}</p>
        <p className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">{sentence}</p>
        <p className="mt-2 text-ink-muted">
          (<span lang="ga">{question.lemma}</span>
          {person === 'auto' && <> · {personLabel.ga}</>})
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p lang="ga" className="font-serif text-4xl font-semibold sm:text-5xl">
        {question.lemma}
      </p>
      {gloss && <p className="mt-1 text-ink-muted">“{gloss}”</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Tag ga={tense.ga.replace(/^An /, '')} en={tense.en} showEnglish={showEnglish} />
        <Tag ga={personLabel.ga} en={personLabel.en} showEnglish={showEnglish} />
        <Tag ga={form.ga} en={form.en} showEnglish={showEnglish} />
      </div>
    </div>
  );
}
