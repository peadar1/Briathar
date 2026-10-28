import type { Mutation } from './types.js';

const VOWELS = 'aeiouáéíóú';
const ECLIPSIS_PREFIX: Record<string, string> = {
  p: 'b',
  b: 'm',
  f: 'bh',
  c: 'g',
  g: 'n',
  t: 'd',
  d: 'n',
};

export function startsWithVowel(word: string): boolean {
  return VOWELS.includes(word.charAt(0).toLowerCase());
}

/** Séimhiú. "s" lenites only before l, n, r or a vowel (so not sc, sm, sp, st). */
export function lenite(word: string): string {
  if (/^[pbmftdcg]j/i.test(word)) return word;
  if (/^[pbmftdcg]/i.test(word) || /^s[rnlaeiouáéíóú]/i.test(word)) {
    return word.charAt(0) + 'h' + word.slice(1);
  }
  return word;
}

/** Séimhiú plus d' before a vowel or f (past tense and conditional): d'ól, d'fhág. */
export function leniteWithD(word: string): string {
  const lenited = lenite(word);
  return /^[aeiouáéíóúf]/i.test(lenited) ? `d'${lenited}` : lenited;
}

/** Urú. With `vowels`, a lowercase vowel takes "n-" and an uppercase one takes "n". */
export function eclipse(word: string, { vowels }: { vowels: boolean }): string {
  const first = word.charAt(0);
  const prefix = ECLIPSIS_PREFIX[first.toLowerCase()];
  if (prefix) return prefix + word;
  if (vowels && VOWELS.includes(first)) return `n-${word}`;
  if (vowels && VOWELS.includes(first.toLowerCase())) return `n${word}`;
  return word;
}

export function mutate(mutation: Mutation, word: string): string {
  switch (mutation) {
    case 'none':
      return word;
    case 'lenition':
      return lenite(word);
    case 'lenitionD':
      return leniteWithD(word);
    case 'eclipsis':
      return eclipse(word, { vowels: true });
    case 'eclipsisNoVowel':
      return eclipse(word, { vowels: false });
  }
}
