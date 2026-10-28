import { PERSONS, SENTENCE_FORMS, TENSES, type QuizItem } from './types.js';

export function itemKey(item: QuizItem): string {
  return `${item.lemma}|${item.tense}|${item.form}|${item.person}`;
}

export function parseItemKey(key: string): QuizItem | null {
  const [lemma, tense, form, person] = key.split('|');
  if (
    !lemma ||
    !TENSES.includes(tense as QuizItem['tense']) ||
    !SENTENCE_FORMS.includes(form as QuizItem['form']) ||
    !PERSONS.includes(person as QuizItem['person'])
  ) {
    return null;
  }
  return { lemma, tense, form, person } as QuizItem;
}
