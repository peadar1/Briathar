export const TENSES = ['past', 'present', 'future', 'conditional'] as const;
export type Tense = (typeof TENSES)[number];

export const SENTENCE_FORMS = [
  'affirmative',
  'negative',
  'interrogative',
  'negativeInterrogative',
] as const;
export type SentenceForm = (typeof SENTENCE_FORMS)[number];

export const PERSONS = ['sg1', 'sg2', 'sg3m', 'sg3f', 'pl1', 'pl2', 'pl3', 'auto'] as const;
export type Person = (typeof PERSONS)[number];

export type Conjugation = 1 | 2 | 'irregular';

/** Tense keys as stored in BuNaMo. `Pres` exists only for "bí" (tá); other verbs use `PresCont`. */
export type LexTense = 'Past' | 'Pres' | 'PresCont' | 'Fut' | 'Cond';
export type LexPerson = 'Base' | 'Sg1' | 'Sg2' | 'Sg3' | 'Pl1' | 'Pl2' | 'Pl3' | 'Auto';
export type Dependency = 'Indep' | 'Dep';
export type Slots = Partial<Record<LexPerson, string[]>>;

export interface LexiconEntry {
  lemma: string;
  conjugation: Conjugation;
  /** English glosses: base, past, past participle, 3rd person singular present. */
  en: [base: string, past: string, participle: string, thirdPerson: string];
  verbalNoun: string[];
  /** Unmutated stems. `Dep` is omitted when identical to `Indep`. */
  forms: Partial<Record<LexTense, { Indep: Slots; Dep?: Slots }>>;
}

export type Mutation = 'none' | 'lenition' | 'lenitionD' | 'eclipsis' | 'eclipsisNoVowel';

export type StepCode =
  | 'irregular'
  | 'stem'
  | 'particle'
  | 'mutation'
  | 'pronoun'
  | 'contraction'
  | 'alternatives';

export interface Step {
  code: StepCode;
  text: string;
}

export interface ConjugationResult {
  /** Every standard-valid answer; the first is the canonical one shown to learners. */
  answers: string[];
  /** How the canonical answer was built, for wrong-answer explanations. */
  steps: Step[];
}

export interface QuizItem {
  lemma: string;
  tense: Tense;
  form: SentenceForm;
  person: Person;
}
