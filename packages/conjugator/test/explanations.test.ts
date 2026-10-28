import { describe, expect, it } from 'vitest';
import { conjugate, getVerb, type Person, type SentenceForm, type Tense } from '../src/index.js';

const explain = (lemma: string, tense: Tense, form: SentenceForm, person: Person) =>
  conjugate(getVerb(lemma)!, tense, form, person)!;

const mutationText = (result: ReturnType<typeof explain>) =>
  result.steps.find((s) => s.code === 'mutation')!.text;

describe('explanation steps', () => {
  it('explains níor + séimhiú for a regular past negative', () => {
    const result = explain('fág', 'past', 'negative', 'sg1');
    expect(result.answers[0]).toBe('níor fhág mé');
    expect(result.steps.map((s) => s.code)).toEqual(['stem', 'particle', 'mutation', 'pronoun']);
    expect(mutationText(result)).toContain('fág → fhág');
  });

  it("explains d' before a vowel", () => {
    expect(mutationText(explain('ól', 'past', 'affirmative', 'sg3m'))).toContain("d'ól");
  });

  it('flags irregular dependent forms', () => {
    const result = explain('faigh', 'past', 'negative', 'sg1');
    expect(result.answers[0]).toBe('ní bhfuair mé');
    expect(result.steps[0]!.code).toBe('irregular');
    expect(mutationText(result)).toContain('Urú');
  });

  it('explains the níl contraction', () => {
    const result = explain('bí', 'present', 'negative', 'sg3f');
    expect(result.answers[0]).toBe('níl sí');
    expect(result.steps.some((s) => s.code === 'contraction')).toBe(true);
  });

  it('lists alternative accepted answers', () => {
    const result = explain('téigh', 'past', 'affirmative', 'pl1');
    expect(result.answers).toEqual(['chuamar', 'chuaigh muid']);
    expect(result.steps.at(-1)).toEqual({ code: 'alternatives', text: 'Also correct: chuaigh muid.' });
  });

  it('explains that r cannot take séimhiú', () => {
    expect(mutationText(explain('téigh', 'future', 'negative', 'sg1'))).toContain(
      '"r" can\'t take séimhiú',
    );
  });

  it('explains the past autonomous', () => {
    const result = explain('ceannaigh', 'past', 'negative', 'auto');
    expect(result.answers[0]).toBe('níor ceannaíodh');
    expect(mutationText(result)).toContain('never takes séimhiú');
  });
});
