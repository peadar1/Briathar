import type { Person, SentenceForm, Tense } from '@briathra/conjugator';
import type { QuizConfig, QuizMode } from '@briathra/shared';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const quizSessions = pgTable('quiz_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull(),
  userId: text('user_id'),
  presetId: text('preset_id'),
  mode: jsonb('mode').$type<QuizMode>().notNull(),
  config: jsonb('config').$type<QuizConfig>().notNull(),
  strictFadas: boolean('strict_fadas').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  correct: integer('correct').notNull().default(0),
  attempted: integer('attempted').notNull().default(0),
});

export const sessionQuestions = pgTable(
  'session_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => quizSessions.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    lemma: text('lemma').notNull(),
    tense: text('tense').$type<Tense>().notNull(),
    form: text('form').$type<SentenceForm>().notNull(),
    persons: jsonb('persons').$type<Person[]>().notNull(),
    answeredAt: timestamp('answered_at', { withTimezone: true }),
    responses: jsonb('responses').$type<Partial<Record<Person, string>>>(),
    results: jsonb('results').$type<Partial<Record<Person, boolean>>>(),
  },
  (t) => [uniqueIndex('session_questions_session_position').on(t.sessionId, t.position)],
);

export const schema = { quizSessions, sessionQuestions };
