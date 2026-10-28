// Rule tables ported from Gramadán's VP/Verb classes (github.com/michmech/Gramadan, MIT, © Foras na Gaeilge).
import type { Dependency, LexPerson, LexTense, Mutation, Person, SentenceForm } from './types.js';

export interface ParticleRule {
  particle: string;
  mutation: Mutation;
  dependency: Dependency;
}

type FormRules = Record<SentenceForm, ParticleRule>;

const PAST: FormRules = {
  affirmative: { particle: '', mutation: 'lenitionD', dependency: 'Indep' },
  negative: { particle: 'níor', mutation: 'lenition', dependency: 'Dep' },
  interrogative: { particle: 'ar', mutation: 'lenition', dependency: 'Dep' },
  negativeInterrogative: { particle: 'nár', mutation: 'lenition', dependency: 'Dep' },
};

const PRESENT_FUTURE: FormRules = {
  affirmative: { particle: '', mutation: 'none', dependency: 'Indep' },
  negative: { particle: 'ní', mutation: 'lenition', dependency: 'Dep' },
  interrogative: { particle: 'an', mutation: 'eclipsisNoVowel', dependency: 'Dep' },
  negativeInterrogative: { particle: 'nach', mutation: 'eclipsis', dependency: 'Dep' },
};

const CONDITIONAL: FormRules = {
  ...PRESENT_FUTURE,
  affirmative: { particle: '', mutation: 'lenitionD', dependency: 'Indep' },
};

const DEFAULT_RULES: Record<LexTense, FormRules> = {
  Past: PAST,
  Pres: PRESENT_FUTURE,
  PresCont: PRESENT_FUTURE,
  Fut: PRESENT_FUTURE,
  Cond: CONDITIONAL,
};

export function defaultRule(tense: LexTense, form: SentenceForm, person: Person): ParticleRule {
  const rule = DEFAULT_RULES[tense][form];
  // The past autonomous takes no séimhiú and no d': ceapadh, níor ceapadh, óladh.
  if (tense === 'Past' && person === 'auto') return { ...rule, mutation: 'none' };
  return rule;
}

export interface Realisation {
  slot: LexPerson;
  pronoun?: string;
}

export const PRONOUNS: Record<Exclude<Person, 'auto'>, string> = {
  sg1: 'mé',
  sg2: 'tú',
  sg3m: 'sé',
  sg3f: 'sí',
  pl1: 'muid',
  pl2: 'sibh',
  pl3: 'siad',
};

const analytic = (person: Exclude<Person, 'auto'>): Realisation => ({
  slot: 'Base',
  pronoun: PRONOUNS[person],
});
const synthetic = (slot: LexPerson): Realisation => ({ slot });

function personPlan(overrides: Partial<Record<Person, Realisation[]>>): Record<Person, Realisation[]> {
  return {
    sg1: [analytic('sg1')],
    sg2: [analytic('sg2')],
    sg3m: [analytic('sg3m')],
    sg3f: [analytic('sg3f')],
    pl1: [analytic('pl1')],
    pl2: [analytic('pl2')],
    pl3: [analytic('pl3')],
    auto: [synthetic('Auto')],
    ...overrides,
  };
}

/** Which synthetic/analytic forms are standard for each person, in display-preference order. */
export const PERSON_PLANS: Record<LexTense, Record<Person, Realisation[]>> = {
  Past: personPlan({
    pl1: [synthetic('Pl1'), analytic('pl1')],
    pl3: [analytic('pl3'), synthetic('Pl3')],
  }),
  Pres: personPlan({
    sg1: [synthetic('Sg1'), analytic('sg1')],
    pl1: [synthetic('Pl1'), analytic('pl1')],
  }),
  PresCont: personPlan({
    sg1: [synthetic('Sg1')],
    pl1: [synthetic('Pl1'), analytic('pl1')],
  }),
  Fut: personPlan({
    pl1: [synthetic('Pl1'), analytic('pl1')],
  }),
  Cond: personPlan({
    sg1: [synthetic('Sg1')],
    sg2: [synthetic('Sg2')],
    pl1: [synthetic('Pl1'), analytic('pl1')],
    pl3: [synthetic('Pl3'), analytic('pl3')],
  }),
};

export interface IrregularOverride {
  tenses: LexTense[] | 'all';
  forms: SentenceForm[];
  persons?: Person[];
  rule: Partial<ParticleRule>;
  note: string;
}

const ALL_FORMS: SentenceForm[] = ['affirmative', 'negative', 'interrogative', 'negativeInterrogative'];

/** Past-tense pattern shared by verbs that use ní/an/nach + a dependent form instead of níor/ar/nár. */
function dependentPast(
  lemma: string,
  negativeMutation: Mutation,
  example: string,
): IrregularOverride[] {
  const note = `"${lemma}" is irregular: in the past tense it uses ní / an / nach (not níor / ar / nár) with its dependent form (${example}).`;
  return [
    { tenses: ['Past'], forms: ['negative'], rule: { particle: 'ní', mutation: negativeMutation }, note },
    { tenses: ['Past'], forms: ['interrogative'], rule: { particle: 'an', mutation: 'eclipsisNoVowel' }, note },
    { tenses: ['Past'], forms: ['negativeInterrogative'], rule: { particle: 'nach', mutation: 'eclipsis' }, note },
  ];
}

export const IRREGULAR_OVERRIDES: Record<string, IrregularOverride[]> = {
  bí: [
    {
      tenses: ['Past'],
      forms: ['affirmative'],
      rule: { mutation: 'lenition' },
      note: '"bí" is irregular: its past tense is "bhí".',
    },
    ...(['negative', 'interrogative', 'negativeInterrogative'] as const).map(
      (form): IrregularOverride => ({
        tenses: ['Past'],
        forms: [form],
        rule: { particle: { negative: 'ní', interrogative: 'an', negativeInterrogative: 'nach' }[form], mutation: 'none' },
        note: '"bí" is irregular: in the past tense it uses ní / an / nach with the dependent form "raibh", which never mutates.',
      }),
    ),
  ],
  abair: [
    { tenses: 'all', forms: ['affirmative'], rule: { mutation: 'none' }, note: '"abair" never takes séimhiú (dúirt, deir, déarfaidh).' },
    { tenses: 'all', forms: ['negative'], rule: { particle: 'ní', mutation: 'none' }, note: '"abair" never takes séimhiú, even after "ní" (ní dúirt, ní deir).' },
    { tenses: 'all', forms: ['interrogative'], rule: { particle: 'an', mutation: 'eclipsisNoVowel' }, note: '"abair" uses "an" + urú in every tense (an ndúirt?).' },
    { tenses: 'all', forms: ['negativeInterrogative'], rule: { particle: 'nach', mutation: 'eclipsis' }, note: '"abair" uses "nach" + urú in every tense (nach ndúirt?).' },
  ],
  déan: dependentPast('déan', 'lenition', 'ní dhearna, an ndearna'),
  feic: [
    { tenses: ['Past'], forms: ['affirmative'], rule: { mutation: 'lenition' }, note: '"feic" is irregular: its past tense is "chonaic".' },
    ...dependentPast('feic', 'lenition', 'ní fhaca, an bhfaca'),
  ],
  téigh: [
    { tenses: ['Past'], forms: ['affirmative'], rule: { mutation: 'lenition' }, note: '"téigh" is irregular: its past tense is "chuaigh".' },
    ...dependentPast('téigh', 'lenition', 'ní dheachaigh, an ndeachaigh'),
  ],
  faigh: [
    { tenses: ['Past'], forms: ['affirmative'], rule: { mutation: 'none' }, note: '"faigh" is irregular: its past tense "fuair" takes no séimhiú.' },
    ...dependentPast('faigh', 'eclipsis', 'ní bhfuair, an bhfuair'),
    { tenses: ['Past'], forms: ['negative'], rule: { particle: 'ní', mutation: 'eclipsis' }, note: '"faigh" is irregular: "ní" causes urú instead of séimhiú (ní bhfuair).' },
    { tenses: ['Fut'], forms: ['affirmative'], rule: { mutation: 'lenition' }, note: '"faigh" is irregular: its future tense is "gheobhaidh".' },
    { tenses: ['Fut', 'Cond'], forms: ['negative'], rule: { particle: 'ní', mutation: 'eclipsis' }, note: '"faigh" is irregular: "ní" causes urú instead of séimhiú (ní bhfaighidh, ní bhfaigheadh).' },
    { tenses: ['Fut'], forms: ['interrogative'], rule: { particle: 'an', mutation: 'eclipsisNoVowel' }, note: '"faigh" uses its dependent form after "an" (an bhfaighidh?).' },
    { tenses: ['Fut'], forms: ['negativeInterrogative'], rule: { particle: 'nach', mutation: 'eclipsis' }, note: '"faigh" uses its dependent form after "nach" (nach bhfaighidh?).' },
  ],
  ...Object.fromEntries(
    ['tar', 'clois', 'cluin'].map((lemma) => [
      lemma,
      [
        {
          tenses: ['Past'],
          forms: ALL_FORMS,
          persons: ['auto'],
          rule: { mutation: 'lenition' },
          note: `"${lemma}" is irregular: its past autonomous form takes séimhiú.`,
        } satisfies IrregularOverride,
      ],
    ]),
  ),
};

export function findOverride(
  lemma: string,
  tense: LexTense,
  form: SentenceForm,
  person: Person,
): IrregularOverride | undefined {
  // Later entries win, matching the order Gramadán applies its exceptions in.
  return (IRREGULAR_OVERRIDES[lemma] ?? [])
    .filter(
      (o) =>
        (o.tenses === 'all' || o.tenses.includes(tense)) &&
        o.forms.includes(form) &&
        (!o.persons || o.persons.includes(person)),
    )
    .at(-1);
}
