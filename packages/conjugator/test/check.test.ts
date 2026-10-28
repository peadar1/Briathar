import { describe, expect, it } from 'vitest';
import { checkAnswer, normaliseAnswer } from '../src/index.js';

const answers = ["d'ólamar", "d'ól muid"];

describe('normaliseAnswer', () => {
  it('ignores case, extra spaces, curly apostrophes and trailing punctuation', () => {
    expect(normaliseAnswer('  An   nDeachaigh  tú? ')).toBe('an ndeachaigh tú');
    expect(normaliseAnswer('D’ól mé')).toBe("d'ól mé");
    expect(normaliseAnswer("d' ól mé")).toBe("d'ól mé");
  });

  it('treats decomposed and precomposed fadas as equal', () => {
    expect(normaliseAnswer('ól')).toBe('ól');
  });
});

describe('checkAnswer', () => {
  it('accepts any standard form', () => {
    expect(checkAnswer("d'ól muid", answers, { strictFadas: true })).toMatchObject({
      correct: true,
      expected: "d'ól muid",
    });
  });

  it('rejects a missing fada in strict mode and flags it', () => {
    expect(checkAnswer("d'olamar", answers, { strictFadas: true })).toEqual({
      correct: false,
      expected: "d'ólamar",
      fadaWarning: false,
      fadaOnly: true,
    });
  });

  it('accepts a missing fada in lenient mode with a warning', () => {
    expect(checkAnswer("d'olamar", answers, { strictFadas: false })).toEqual({
      correct: true,
      expected: "d'ólamar",
      fadaWarning: true,
      fadaOnly: false,
    });
  });

  it('returns the canonical answer when wrong', () => {
    expect(checkAnswer('ól mé', answers, { strictFadas: false })).toMatchObject({
      correct: false,
      expected: "d'ólamar",
    });
  });
});
