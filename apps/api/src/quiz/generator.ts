import { conjugate, getVerb, type Person, type SentenceForm, type Tense } from '@briathra/conjugator';
import type { QuizConfig } from '@briathra/shared';

export type Rng = () => number;

/** Small deterministic PRNG so tests can pin question order. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GeneratedQuestion {
  lemma: string;
  tense: Tense;
  form: SentenceForm;
  persons: Person[];
}

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)]!;

function isAnswerable(lemma: string, tense: Tense, form: SentenceForm, person: Person): boolean {
  const verb = getVerb(lemma);
  return !!verb && conjugate(verb, tense, form, person) !== null;
}

const MAX_ATTEMPTS = 50;

export function generateQuestions(
  config: QuizConfig,
  count: number,
  { table, rng = Math.random, previous }: { table: boolean; rng?: Rng; previous?: GeneratedQuestion },
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  let last = previous;

  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !question; attempt++) {
      const lemma = pick(config.lemmas, rng);
      const tense = pick(config.tenses, rng);
      const form = pick(config.forms, rng);
      const persons = table
        ? config.persons.filter((p) => isAnswerable(lemma, tense, form, p))
        : [pick(config.persons, rng)].filter((p) => isAnswerable(lemma, tense, form, p));
      const repeatsLast =
        last?.lemma === lemma && last.tense === tense && last.form === form && last.persons[0] === persons[0];
      const canAvoidRepeat = config.lemmas.length * config.tenses.length * config.forms.length > 1;
      if (persons.length > 0 && !(repeatsLast && canAvoidRepeat)) {
        question = { lemma, tense, form, persons };
      }
    }
    if (!question) throw new Error('Could not generate a question for this configuration');
    questions.push(question);
    last = question;
  }
  return questions;
}
