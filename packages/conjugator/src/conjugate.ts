import { lenite, mutate, startsWithVowel } from './mutations.js';
import { PERSON_PLANS, defaultRule, findOverride, type ParticleRule, type Realisation } from './rules.js';
import type {
  ConjugationResult,
  LexTense,
  LexiconEntry,
  Person,
  SentenceForm,
  Slots,
  Step,
  Tense,
} from './types.js';

const TENSE_NAMES: Record<LexTense, string> = {
  Past: 'past tense',
  Pres: 'present tense',
  PresCont: 'present tense',
  Fut: 'future tense',
  Cond: 'conditional mood',
};

const PARTICLE_MEANINGS: Record<string, string> = {
  níor: 'makes a past-tense verb negative',
  ar: 'asks a question in the past tense',
  nár: 'asks a negative question in the past tense',
  ní: 'makes the verb negative',
  an: 'asks a question',
  nach: 'asks a negative question',
};

export function toLexTense(verb: LexiconEntry, tense: Tense): LexTense {
  switch (tense) {
    case 'past':
      return 'Past';
    case 'present':
      return verb.forms.Pres ? 'Pres' : 'PresCont';
    case 'future':
      return 'Fut';
    case 'conditional':
      return 'Cond';
  }
}

function contractNil(phrase: string): string {
  return phrase.startsWith('ní fhuil') ? 'níl' + phrase.slice('ní fhuil'.length) : phrase;
}

export function conjugate(
  verb: LexiconEntry,
  tense: Tense,
  form: SentenceForm,
  person: Person,
): ConjugationResult | null {
  const lexTense = toLexTense(verb, tense);
  const tenseForms = verb.forms[lexTense];
  if (!tenseForms) return null;

  const override = findOverride(verb.lemma, lexTense, form, person);
  const rule: ParticleRule = { ...defaultRule(lexTense, form, person), ...override?.rule };
  const slots: Slots =
    rule.dependency === 'Dep' ? (tenseForms.Dep ?? tenseForms.Indep) : tenseForms.Indep;
  const isNegativeBi = verb.lemma === 'bí' && lexTense === 'Pres' && form === 'negative';

  const answers: string[] = [];
  let canonical: { stem: string; mutated: string; realisation: Realisation } | undefined;
  for (const realisation of PERSON_PLANS[lexTense][person]) {
    for (const stem of slots[realisation.slot] ?? []) {
      const mutated = mutate(rule.mutation, stem);
      let phrase = [rule.particle, mutated, realisation.pronoun].filter(Boolean).join(' ');
      if (isNegativeBi) phrase = contractNil(phrase);
      answers.push(phrase);
      canonical ??= { stem, mutated, realisation };
    }
  }
  if (!canonical) return null;

  const steps: Step[] = [];
  if (override) steps.push({ code: 'irregular', text: override.note });
  steps.push(stemStep(verb, lexTense, rule, canonical.stem, canonical.realisation, tenseForms));
  if (rule.particle) {
    steps.push({
      code: 'particle',
      text: `"${rule.particle}" ${PARTICLE_MEANINGS[rule.particle] ?? 'comes before the verb'}.`,
    });
  }
  const mutationStep = describeMutation(rule, lexTense, person, canonical.stem, canonical.mutated, !!override);
  if (mutationStep) steps.push(mutationStep);
  if (canonical.realisation.pronoun) {
    steps.push({ code: 'pronoun', text: `Add the subject pronoun "${canonical.realisation.pronoun}".` });
  }
  if (isNegativeBi && answers[0]?.startsWith('níl')) {
    steps.push({ code: 'contraction', text: '"ní fhuil" is always contracted to "níl".' });
  }
  if (answers.length > 1) {
    steps.push({ code: 'alternatives', text: `Also correct: ${answers.slice(1).join(', ')}.` });
  }
  return { answers, steps };
}

function stemStep(
  verb: LexiconEntry,
  tense: LexTense,
  rule: ParticleRule,
  stem: string,
  realisation: Realisation,
  tenseForms: { Indep: Slots; Dep?: Slots },
): Step {
  const tenseName = TENSE_NAMES[tense];
  if (rule.dependency === 'Dep' && tenseForms.Dep) {
    const independent = tenseForms.Indep[realisation.slot]?.[0];
    if (independent && independent !== stem) {
      return {
        code: 'stem',
        text: `After a particle, "${verb.lemma}" uses its dependent ${tenseName} form "${stem}" instead of "${independent}".`,
      };
    }
  }
  if (realisation.slot === 'Auto') {
    return { code: 'stem', text: `The autonomous (saorbhriathar) ${tenseName} form is "${stem}"; it never takes a pronoun.` };
  }
  if (realisation.slot !== 'Base') {
    return {
      code: 'stem',
      text: `Use the synthetic ${tenseName} form "${stem}": the ending already contains the subject, so no pronoun is added.`,
    };
  }
  return { code: 'stem', text: `The ${tenseName} form of "${verb.lemma}" is "${stem}".` };
}

function describeMutation(
  rule: ParticleRule,
  tense: LexTense,
  person: Person,
  stem: string,
  mutated: string,
  isIrregular: boolean,
): Step | null {
  const after = rule.particle ? `after "${rule.particle}"` : `in the ${TENSE_NAMES[tense]}`;
  const first = stem.charAt(0);

  switch (rule.mutation) {
    case 'none':
      if (tense === 'Past' && person === 'auto' && !isIrregular && lenite(stem) !== stem) {
        return { code: 'mutation', text: 'The past autonomous form never takes séimhiú or d\'.' };
      }
      return null;
    case 'lenition':
    case 'lenitionD': {
      if (mutated.startsWith("d'")) {
        return {
          code: 'mutation',
          text: `Verbs beginning with a vowel or "f" take d' ${after}: ${stem} → ${mutated}.`,
        };
      }
      if (mutated !== stem) {
        return {
          code: 'mutation',
          text: `Séimhiú ${after}: "${first}" becomes "${first}h" (${stem} → ${mutated}).`,
        };
      }
      return {
        code: 'mutation',
        text: startsWithVowel(stem)
          ? `Vowels can't take séimhiú, so "${stem}" doesn't change.`
          : `"${first}" can't take séimhiú, so "${stem}" doesn't change.`,
      };
    }
    case 'eclipsis':
    case 'eclipsisNoVowel': {
      if (mutated === stem) {
        return {
          code: 'mutation',
          text: startsWithVowel(stem)
            ? `"${rule.particle}" doesn't add n- before a vowel, so "${stem}" doesn't change.`
            : `"${first}" can't take urú, so "${stem}" doesn't change.`,
        };
      }
      const prefix = mutated.slice(0, mutated.length - stem.length);
      return {
        code: 'mutation',
        text: `Urú ${after}: "${prefix}" goes before "${first}" (${stem} → ${mutated}).`,
      };
    }
  }
}
