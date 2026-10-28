import data from './data/lexicon.json';
import type { LexiconEntry } from './types.js';

/** Verb forms derived from BuNaMo (© Foras na Gaeilge, ODbL 1.0). */
export const LEXICON: readonly LexiconEntry[] = data as unknown as LexiconEntry[];

const byLemma = new Map(LEXICON.map((verb) => [verb.lemma, verb]));

export function getVerb(lemma: string): LexiconEntry | undefined {
  return byLemma.get(lemma);
}

export const IRREGULAR_LEMMAS: readonly string[] = LEXICON.filter(
  (v) => v.conjugation === 'irregular',
).map((v) => v.lemma);
