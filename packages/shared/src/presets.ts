import { IRREGULAR_LEMMAS, LEXICON, PERSONS, SENTENCE_FORMS, TENSES } from '@briathra/conjugator';
import type { QuizConfig } from './schemas.js';

export interface Preset {
  id: string;
  title: { ga: string; en: string };
  description: { ga: string; en: string };
  config: QuizConfig;
}

const PERSONS_NO_AUTO = PERSONS.filter((p) => p !== 'auto');

/** Frequent verbs from school syllabuses: the irregulars plus everyday regular verbs. */
const CORE_REGULAR = [
  'ól', 'dún', 'fág', 'féach', 'glan', 'scríobh', 'tóg', 'bris', 'cuir', 'éist',
  'rith', 'siúil', 'tuig', 'fan', 'léigh', 'suigh', 'buail', 'ceannaigh', 'tosaigh',
  'críochnaigh', 'éirigh', 'imigh', 'oscail', 'imir', 'inis', 'labhair', 'codail',
  'foghlaim', 'oibrigh', 'smaoinigh',
];

const conjugationLemmas = (c: 1 | 2) =>
  LEXICON.filter((v) => v.conjugation === c).map((v) => v.lemma);

const singleTense = (tense: (typeof TENSES)[number]): QuizConfig => ({
  lemmas: [...IRREGULAR_LEMMAS, ...CORE_REGULAR],
  tenses: [tense],
  forms: [...SENTENCE_FORMS],
  persons: PERSONS_NO_AUTO,
});

export const PRESETS: Preset[] = [
  {
    id: 'irregular',
    title: { ga: 'Na Briathra Neamhrialta', en: 'The irregular verbs' },
    description: {
      ga: 'Na 11 briathar neamhrialta, gach aimsir.',
      en: 'All 11 irregular verbs in every tense: the exam essentials.',
    },
    config: {
      lemmas: [...IRREGULAR_LEMMAS],
      tenses: [...TENSES],
      forms: [...SENTENCE_FORMS],
      persons: PERSONS_NO_AUTO,
    },
  },
  {
    id: 'past',
    title: { ga: 'An Aimsir Chaite', en: 'Past tense' },
    description: { ga: 'Briathra coitianta san Aimsir Chaite.', en: 'Common verbs in the past tense.' },
    config: singleTense('past'),
  },
  {
    id: 'present',
    title: { ga: 'An Aimsir Láithreach', en: 'Present tense' },
    description: { ga: 'Briathra coitianta san Aimsir Láithreach.', en: 'Common verbs in the present tense.' },
    config: singleTense('present'),
  },
  {
    id: 'future',
    title: { ga: 'An Aimsir Fháistineach', en: 'Future tense' },
    description: { ga: 'Briathra coitianta san Aimsir Fháistineach.', en: 'Common verbs in the future tense.' },
    config: singleTense('future'),
  },
  {
    id: 'conditional',
    title: { ga: 'An Modh Coinníollach', en: 'Conditional mood' },
    description: { ga: 'Briathra coitianta sa Mhodh Coinníollach.', en: 'Common verbs in the conditional.' },
    config: singleTense('conditional'),
  },
  {
    id: 'first-conjugation',
    title: { ga: 'An Chéad Réimniú', en: 'First conjugation' },
    description: { ga: 'Briathra rialta den chéad réimniú.', en: 'Regular first-conjugation verbs, all tenses.' },
    config: {
      lemmas: conjugationLemmas(1),
      tenses: [...TENSES],
      forms: [...SENTENCE_FORMS],
      persons: PERSONS_NO_AUTO,
    },
  },
  {
    id: 'second-conjugation',
    title: { ga: 'An Dara Réimniú', en: 'Second conjugation' },
    description: { ga: 'Briathra rialta den dara réimniú.', en: 'Regular second-conjugation verbs, all tenses.' },
    config: {
      lemmas: conjugationLemmas(2),
      tenses: [...TENSES],
      forms: [...SENTENCE_FORMS],
      persons: PERSONS_NO_AUTO,
    },
  },
  {
    id: 'exam-mix',
    title: { ga: 'Measc Scrúdaithe', en: 'Exam mix' },
    description: {
      ga: 'Gach rud, an saorbhriathar san áireamh.',
      en: 'Everything, including the autonomous form.',
    },
    config: {
      lemmas: [...IRREGULAR_LEMMAS, ...CORE_REGULAR],
      tenses: [...TENSES],
      forms: [...SENTENCE_FORMS],
      persons: [...PERSONS],
    },
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
