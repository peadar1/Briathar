import type { Person, SentenceForm, Tense } from './types.js';

export interface Label {
  ga: string;
  en: string;
}

export const TENSE_LABELS: Record<Tense, Label> = {
  past: { ga: 'An Aimsir Chaite', en: 'Past tense' },
  present: { ga: 'An Aimsir Láithreach', en: 'Present tense' },
  future: { ga: 'An Aimsir Fháistineach', en: 'Future tense' },
  conditional: { ga: 'An Modh Coinníollach', en: 'Conditional mood' },
};

export const FORM_LABELS: Record<SentenceForm, Label> = {
  affirmative: { ga: 'Dearfach', en: 'Affirmative' },
  negative: { ga: 'Diúltach', en: 'Negative' },
  interrogative: { ga: 'Ceisteach', en: 'Question' },
  negativeInterrogative: { ga: 'Ceisteach diúltach', en: 'Negative question' },
};

export const PERSON_LABELS: Record<Person, Label> = {
  sg1: { ga: 'mé', en: 'I' },
  sg2: { ga: 'tú', en: 'you (sg.)' },
  sg3m: { ga: 'sé', en: 'he' },
  sg3f: { ga: 'sí', en: 'she' },
  pl1: { ga: 'muid', en: 'we' },
  pl2: { ga: 'sibh', en: 'you (pl.)' },
  pl3: { ga: 'siad', en: 'they' },
  auto: { ga: 'saorbhriathar', en: 'autonomous' },
};
