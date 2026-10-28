import { describe, expect, it } from 'vitest';
import golden from './fixtures/gramadan-golden.json';
import { LEXICON, PERSONS, SENTENCE_FORMS, TENSES, conjugate } from '../src/index.js';

type Golden = Record<string, Record<string, Record<string, Record<string, string[]>>>>;
const fixtures = golden as Golden;

// The oracle (data/oracle) runs Gramadán over BuNaMo. "present" in the fixtures is the habitual
// present (bíonn); for "bí" the school present tense (tá) is stored under "presentBi".
function goldenTenseKey(lemma: string, tense: string): string {
  return tense === 'present' && lemma === 'bí' ? 'presentBi' : tense;
}

describe('conjugate() matches Gramadán for every verb', () => {
  it('covers the whole lexicon', () => {
    expect(Object.keys(fixtures).sort()).toEqual(LEXICON.map((v) => v.lemma).sort());
  });

  it.each(LEXICON.map((v) => [v.lemma, v] as const))('%s', (lemma, verb) => {
    for (const tense of TENSES) {
      for (const form of SENTENCE_FORMS) {
        for (const person of PERSONS) {
          const expected = fixtures[lemma]?.[goldenTenseKey(lemma, tense)]?.[form]?.[person] ?? [];
          const actual = conjugate(verb, tense, form, person)?.answers ?? [];
          expect(actual, `${lemma} ${tense} ${form} ${person}`).toEqual(expected);
        }
      }
    }
  });
});
