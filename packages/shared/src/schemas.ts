import { LEXICON, PERSONS, SENTENCE_FORMS, TENSES } from '@briathra/conjugator';
import { z } from 'zod';

const KNOWN_LEMMAS = new Set(LEXICON.map((v) => v.lemma));

export const tenseSchema = z.enum(TENSES);
export const sentenceFormSchema = z.enum(SENTENCE_FORMS);
export const personSchema = z.enum(PERSONS);

export const quizConfigSchema = z.object({
  lemmas: z
    .array(z.string())
    .min(1)
    .max(LEXICON.length)
    .refine((lemmas) => lemmas.every((l) => KNOWN_LEMMAS.has(l)), 'Unknown verb'),
  tenses: z.array(tenseSchema).min(1),
  forms: z.array(sentenceFormSchema).min(1),
  persons: z.array(personSchema).min(1),
});
export type QuizConfig = z.infer<typeof quizConfigSchema>;

export const TIMED_DURATIONS = [120, 300, 600] as const;
export const QUESTION_COUNTS = [10, 20, 50] as const;

export const quizModeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('timed'),
    durationSec: z.union(TIMED_DURATIONS.map((d) => z.literal(d))),
  }),
  z.object({
    kind: z.literal('fixed'),
    questionCount: z.union(QUESTION_COUNTS.map((n) => z.literal(n))),
  }),
  z.object({ kind: z.literal('practice') }),
  z.object({
    kind: z.literal('table'),
    questionCount: z.union(QUESTION_COUNTS.map((n) => z.literal(n))),
  }),
]);
export type QuizMode = z.infer<typeof quizModeSchema>;

export const createSessionSchema = z.object({
  config: quizConfigSchema,
  mode: quizModeSchema,
  strictFadas: z.boolean(),
  presetId: z.string().max(64).optional(),
});
export type CreateSessionRequest = z.infer<typeof createSessionSchema>;

export const quizItemSchema = z.object({
  lemma: z.string(),
  tense: tenseSchema,
  form: sentenceFormSchema,
  person: personSchema,
});

/** A question as sent to the client: never contains the answer. */
export interface QuestionDto {
  id: string;
  position: number;
  lemma: string;
  tense: z.infer<typeof tenseSchema>;
  form: z.infer<typeof sentenceFormSchema>;
  /** One person for single questions; every requested person for conjugation-table questions. */
  persons: z.infer<typeof personSchema>[];
  english: string[];
}

export interface SessionDto {
  id: string;
  token: string;
  mode: QuizMode;
  config: QuizConfig;
  strictFadas: boolean;
  startedAt: string;
  endsAt: string | null;
  questions: QuestionDto[];
}

export const answerSchema = z.object({
  questionId: z.uuid(),
  /** Keyed by person; a single question has exactly one entry. */
  answers: z.partialRecord(personSchema, z.string().max(200)),
});
export type AnswerRequest = z.infer<typeof answerSchema>;

export interface ExplanationStep {
  code: string;
  text: string;
}

export interface CellResult {
  person: z.infer<typeof personSchema>;
  correct: boolean;
  expected: string;
  accepted: string[];
  fadaWarning: boolean;
  fadaOnly: boolean;
  steps: ExplanationStep[];
}

export interface AnswerResultDto {
  questionId: string;
  results: CellResult[];
  score: ScoreDto;
}

export interface ScoreDto {
  correct: number;
  attempted: number;
}

export interface MissedItemDto {
  lemma: string;
  tense: z.infer<typeof tenseSchema>;
  form: z.infer<typeof sentenceFormSchema>;
  person: z.infer<typeof personSchema>;
  given: string;
  expected: string;
}

export interface SessionSummaryDto {
  id: string;
  mode: QuizMode;
  score: ScoreDto;
  accuracy: number;
  durationSec: number;
  missed: MissedItemDto[];
}

export interface ApiError {
  error: string;
  message: string;
}

export type PromptType = 'grammar' | 'english';
