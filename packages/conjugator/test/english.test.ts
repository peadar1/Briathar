import { describe, expect, it } from 'vitest';
import { englishSentence, getVerb } from '../src/index.js';

const verb = (lemma: string) => getVerb(lemma)!;

describe('englishSentence', () => {
  it.each([
    ['téigh', 'past', 'affirmative', 'sg1', 'I went'],
    ['téigh', 'past', 'negative', 'sg1', "I didn't go"],
    ['téigh', 'past', 'interrogative', 'sg2', 'Did you go?'],
    ['téigh', 'past', 'negativeInterrogative', 'pl3', "Didn't they go?"],
    ['ól', 'present', 'affirmative', 'sg3f', 'She drinks'],
    ['ól', 'present', 'negative', 'sg3m', "He doesn't drink"],
    ['ól', 'present', 'interrogative', 'pl1', 'Do we drink?'],
    ['ceannaigh', 'future', 'negative', 'pl2', "You (pl.) won't buy"],
    ['ceannaigh', 'conditional', 'negativeInterrogative', 'sg1', "Wouldn't I buy?"],
    ['éirigh', 'past', 'interrogative', 'sg3m', 'Did he get up?'],
    ['ith', 'past', 'affirmative', 'auto', 'Someone ate'],
  ] as const)('%s %s %s %s → %s', (lemma, tense, form, person, expected) => {
    expect(englishSentence(verb(lemma), tense, form, person)).toBe(expected);
  });

  it.each([
    ['present', 'affirmative', 'sg1', 'I am'],
    ['present', 'negative', 'sg3m', "He isn't"],
    ['present', 'interrogative', 'sg2', 'Are you?'],
    ['present', 'negativeInterrogative', 'pl3', "Aren't they?"],
    ['past', 'affirmative', 'pl1', 'We were'],
    ['past', 'negative', 'sg1', "I wasn't"],
    ['future', 'interrogative', 'sg3f', 'Will she be?'],
    ['conditional', 'negative', 'sg1', "I wouldn't be"],
  ] as const)('bí %s %s %s → %s', (tense, form, person, expected) => {
    expect(englishSentence(verb('bí'), tense, form, person)).toBe(expected);
  });
});
