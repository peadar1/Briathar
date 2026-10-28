import type { LexiconEntry, Person, SentenceForm, Tense } from './types.js';

const SUBJECTS: Record<Person, string> = {
  sg1: 'I',
  sg2: 'you',
  sg3m: 'he',
  sg3f: 'she',
  pl1: 'we',
  pl2: 'you (pl.)',
  pl3: 'they',
  auto: 'someone',
};

const isThirdSingular = (p: Person) => p === 'sg3m' || p === 'sg3f' || p === 'auto';

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "bí" needs am/is/are and was/were instead of auxiliary do-support. */
function beSentence(tense: Tense, form: SentenceForm, person: Person, s: string): string {
  const presentBe = person === 'sg1' ? 'am' : isThirdSingular(person) ? 'is' : 'are';
  const pastBe = person === 'sg1' || isThirdSingular(person) ? 'was' : 'were';
  const be = tense === 'present' ? presentBe : tense === 'past' ? pastBe : null;

  if (be) {
    const negated = be === 'am' ? 'am not' : `${be}n't`;
    switch (form) {
      case 'affirmative':
        return `${s} ${be}`;
      case 'negative':
        return `${s} ${negated}`;
      case 'interrogative':
        return `${capitalise(be)} ${s}?`;
      case 'negativeInterrogative':
        return be === 'am' ? `Am ${s} not?` : `${capitalise(negated)} ${s}?`;
    }
  }
  return modalSentence(tense === 'future' ? 'will' : 'would', form, s, 'be');
}

function modalSentence(modal: 'will' | 'would', form: SentenceForm, s: string, base: string): string {
  const negated = modal === 'will' ? "won't" : "wouldn't";
  switch (form) {
    case 'affirmative':
      return `${s} ${modal} ${base}`;
    case 'negative':
      return `${s} ${negated} ${base}`;
    case 'interrogative':
      return `${capitalise(modal)} ${s} ${base}?`;
    case 'negativeInterrogative':
      return `${capitalise(negated)} ${s} ${base}?`;
  }
}

/** Builds an English prompt such as "I didn't go" or "Would they buy?". */
export function englishSentence(
  verb: LexiconEntry,
  tense: Tense,
  form: SentenceForm,
  person: Person,
): string {
  const [base, past, , thirdPerson] = verb.en;
  const s = SUBJECTS[person];
  let sentence: string;

  if (verb.lemma === 'bí') {
    sentence = beSentence(tense, form, person, s);
  } else if (tense === 'future' || tense === 'conditional') {
    sentence = modalSentence(tense === 'future' ? 'will' : 'would', form, s, base);
  } else {
    const aux =
      tense === 'past' ? 'did' : isThirdSingular(person) ? 'does' : 'do';
    const simple = tense === 'past' ? past : isThirdSingular(person) ? thirdPerson : base;
    switch (form) {
      case 'affirmative':
        sentence = `${s} ${simple}`;
        break;
      case 'negative':
        sentence = `${s} ${aux}n't ${base}`;
        break;
      case 'interrogative':
        sentence = `${capitalise(aux)} ${s} ${base}?`;
        break;
      case 'negativeInterrogative':
        sentence = `${capitalise(aux)}n't ${s} ${base}?`;
        break;
    }
  }
  return capitalise(sentence);
}
