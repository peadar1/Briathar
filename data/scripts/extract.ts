import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Tense = 'Past' | 'Pres' | 'PresCont' | 'Fut' | 'Cond';
type Slots = Record<string, string[]>;

interface ConfigVerb {
  lemma: string;
  en: [string, string, string, string];
}

const KEPT_TENSES = new Set<string>(['Past', 'Pres', 'PresCont', 'Fut', 'Cond']);

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const bunamoDir = join(root, 'data', '.cache', 'bunamo-verbs');
const outPath = join(root, 'packages', 'conjugator', 'src', 'data', 'lexicon.json');
const config = JSON.parse(readFileSync(join(root, 'data', 'verbs.config.json'), 'utf8')) as {
  irregular: ConfigVerb[];
  regular: ConfigVerb[];
};

function decodeEntities(value: string): string {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseElements(xml: string, tag: string): Record<string, string>[] {
  const elements: Record<string, string>[] = [];
  for (const match of xml.matchAll(new RegExp(`<${tag}\\s([^>]*?)/>`, 'g'))) {
    const attrs: Record<string, string> = {};
    for (const [, key, value] of match[1]!.matchAll(/(\w+)="([^"]*)"/g)) {
      attrs[key!] = decodeEntities(value!);
    }
    elements.push(attrs);
  }
  return elements;
}

function sameSlots(a: Slots, b: Slots): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function extract(verb: ConfigVerb, irregular: boolean) {
  const xml = readFileSync(join(bunamoDir, `${verb.lemma}_verb.xml`), 'utf8');
  const forms: Partial<Record<Tense, { Indep: Slots; Dep?: Slots }>> = {};
  const raw: Record<string, { Indep: Slots; Dep: Slots }> = {};

  for (const { default: value, tense, dependency, person } of parseElements(xml, 'tenseForm')) {
    if (!value || !tense || !dependency || !person || !KEPT_TENSES.has(tense)) continue;
    const slots = (raw[tense] ??= { Indep: {}, Dep: {} })[dependency as 'Indep' | 'Dep'];
    (slots[person] ??= []).push(value);
  }
  for (const [tense, { Indep, Dep }] of Object.entries(raw)) {
    forms[tense as Tense] = sameSlots(Indep, Dep) ? { Indep } : { Indep, Dep };
  }

  const futureBase = forms.Fut?.Indep.Base?.[0] ?? '';
  const conjugation = irregular ? 'irregular' : /(ó|eo)idh$/.test(futureBase) ? 2 : 1;

  return {
    lemma: verb.lemma,
    conjugation,
    en: verb.en,
    verbalNoun: parseElements(xml, 'verbalNoun').map((el) => el.default!),
    forms,
  };
}

const lexicon = [
  ...config.irregular.map((v) => extract(v, true)),
  ...config.regular.map((v) => extract(v, false)),
];

writeFileSync(outPath, JSON.stringify(lexicon) + '\n');
const counts = lexicon.reduce<Record<string, number>>((acc, v) => {
  acc[v.conjugation] = (acc[v.conjugation] ?? 0) + 1;
  return acc;
}, {});
console.log(`Wrote ${lexicon.length} verbs to ${outPath}`, counts);
