import { describe, expect, it } from 'vitest';
import { eclipse, lenite, leniteWithD } from '../src/index.js';

describe('lenite (séimhiú)', () => {
  it.each([
    ['cuir', 'chuir'],
    ['bris', 'bhris'],
    ['fág', 'fhág'],
    ['dún', 'dhún'],
    ['glan', 'ghlan'],
    ['seas', 'sheas'],
    ['siúil', 'shiúil'],
    ['snámh', 'shnámh'],
    ['mol', 'mhol'],
  ])('%s → %s', (word, expected) => expect(lenite(word)).toBe(expected));

  it.each(['ól', 'léigh', 'nigh', 'rith', 'scuab', 'stad', 'sp', 'sm'])(
    'leaves %s unchanged',
    (word) => expect(lenite(word)).toBe(word),
  );

  it('never lenites vowels, l, n or r', () => {
    for (const letter of 'aeiouáéíóúlnr') expect(lenite(`${letter}xyz`)).toBe(`${letter}xyz`);
  });
});

describe("leniteWithD (past/conditional d')", () => {
  it.each([
    ['ól', "d'ól"],
    ['fág', "d'fhág"],
    ['éist', "d'éist"],
    ['cuir', 'chuir'],
    ['rith', 'rith'],
  ])('%s → %s', (word, expected) => expect(leniteWithD(word)).toBe(expected));
});

describe('eclipse (urú)', () => {
  it.each([
    ['páirceáil', 'bpáirceáil'],
    ['bris', 'mbris'],
    ['fág', 'bhfág'],
    ['cuir', 'gcuir'],
    ['glan', 'nglan'],
    ['tóg', 'dtóg'],
    ['dún', 'ndún'],
  ])('%s → %s', (word, expected) => expect(eclipse(word, { vowels: true })).toBe(expected));

  it('adds n- before a lowercase vowel only when asked', () => {
    expect(eclipse('ólann', { vowels: true })).toBe('n-ólann');
    expect(eclipse('ólann', { vowels: false })).toBe('ólann');
    expect(eclipse('Éire', { vowels: true })).toBe('nÉire');
  });

  it('never eclipses l, m, n, r or s', () => {
    for (const letter of 'lmnrs') expect(eclipse(`${letter}xyz`, { vowels: true })).toBe(`${letter}xyz`);
  });
});
