import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  checkAnswer,
  conjugate,
  englishSentence,
  getVerb,
  type Person,
} from '@briathra/conjugator';
import type {
  AnswerRequest,
  AnswerResultDto,
  CellResult,
  CreateSessionRequest,
  MissedItemDto,
  QuestionDto,
  SessionDto,
  SessionSummaryDto,
} from '@briathra/shared';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { quizSessions, sessionQuestions } from '../db/schema.js';
import { HttpError, notFound } from '../errors.js';
import { generateQuestions, type Rng } from './generator.js';

type SessionRow = typeof quizSessions.$inferSelect;
type QuestionRow = typeof sessionQuestions.$inferSelect;

/** Questions issued per request in open-ended (timed / practice) modes. */
export const QUESTION_BATCH = 10;
export const MAX_QUESTIONS_PER_SESSION = 1000;
/** Allowance for network latency on the final answer of a timed run. */
export const TIMER_GRACE_MS = 3000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class QuizService {
  constructor(
    private readonly db: Db,
    private readonly now: () => Date = () => new Date(),
    private readonly rng?: Rng,
  ) {}

  async createSession(request: CreateSessionRequest): Promise<SessionDto> {
    const startedAt = this.now();
    const endsAt =
      request.mode.kind === 'timed'
        ? new Date(startedAt.getTime() + request.mode.durationSec * 1000)
        : null;
    const [session] = await this.db
      .insert(quizSessions)
      .values({
        token: randomBytes(24).toString('base64url'),
        presetId: request.presetId ?? null,
        mode: request.mode,
        config: request.config,
        strictFadas: request.strictFadas,
        startedAt,
        endsAt,
      })
      .returning();

    const count =
      request.mode.kind === 'fixed' || request.mode.kind === 'table'
        ? request.mode.questionCount
        : QUESTION_BATCH;
    const questions = await this.insertQuestions(session!, count, 0);
    return toSessionDto(session!, questions);
  }

  async moreQuestions(sessionId: string, token: string): Promise<QuestionDto[]> {
    const session = await this.loadSession(sessionId, token);
    if (session.mode.kind !== 'timed' && session.mode.kind !== 'practice') {
      throw new HttpError(409, 'fixed_length', 'This session has a fixed number of questions');
    }
    this.assertActive(session);
    const [last] = await this.db
      .select()
      .from(sessionQuestions)
      .where(eq(sessionQuestions.sessionId, session.id))
      .orderBy(desc(sessionQuestions.position))
      .limit(1);
    const nextPosition = (last?.position ?? -1) + 1;
    if (nextPosition >= MAX_QUESTIONS_PER_SESSION) {
      throw new HttpError(409, 'question_limit', 'This session has reached its question limit');
    }
    return this.insertQuestions(session, QUESTION_BATCH, nextPosition, last);
  }

  async answer(sessionId: string, token: string, request: AnswerRequest): Promise<AnswerResultDto> {
    const session = await this.loadSession(sessionId, token);
    const question = await this.loadQuestion(session.id, request.questionId);
    const results = grade(question, request.answers, session.strictFadas);

    // Only the first attempt counts; later submissions (e.g. a retype) are graded but not scored.
    if (question.answeredAt) {
      return { questionId: question.id, results, score: scoreOf(session) };
    }
    this.assertActive(session);

    const correctCount = results.filter((r) => r.correct).length;
    const updated = await this.db.transaction(async (tx) => {
      const claimed = await tx
        .update(sessionQuestions)
        .set({
          answeredAt: this.now(),
          responses: Object.fromEntries(question.persons.map((p) => [p, request.answers[p] ?? ''])),
          results: Object.fromEntries(results.map((r) => [r.person, r.correct])),
        })
        .where(and(eq(sessionQuestions.id, question.id), isNull(sessionQuestions.answeredAt)))
        .returning({ id: sessionQuestions.id });
      if (claimed.length === 0) return null;
      const [row] = await tx
        .update(quizSessions)
        .set({
          correct: sql`${quizSessions.correct} + ${correctCount}`,
          attempted: sql`${quizSessions.attempted} + ${results.length}`,
        })
        .where(eq(quizSessions.id, session.id))
        .returning();
      return row ?? null;
    });

    return { questionId: question.id, results, score: scoreOf(updated ?? session) };
  }

  async finish(sessionId: string, token: string): Promise<SessionSummaryDto> {
    let session = await this.loadSession(sessionId, token);
    if (!session.finishedAt) {
      const [row] = await this.db
        .update(quizSessions)
        .set({ finishedAt: this.now() })
        .where(and(eq(quizSessions.id, session.id), isNull(quizSessions.finishedAt)))
        .returning();
      session = row ?? (await this.loadSession(sessionId, token));
    }

    const questions = await this.db
      .select()
      .from(sessionQuestions)
      .where(eq(sessionQuestions.sessionId, session.id))
      .orderBy(asc(sessionQuestions.position));

    const missed: MissedItemDto[] = [];
    for (const q of questions) {
      for (const person of q.persons) {
        if (q.results?.[person] !== false) continue;
        const verb = getVerb(q.lemma)!;
        missed.push({
          lemma: q.lemma,
          tense: q.tense,
          form: q.form,
          person,
          given: q.responses?.[person] ?? '',
          expected: conjugate(verb, q.tense, q.form, person)!.answers[0]!,
        });
      }
    }

    const end = Math.min(
      session.finishedAt!.getTime(),
      session.endsAt?.getTime() ?? Number.POSITIVE_INFINITY,
    );
    return {
      id: session.id,
      mode: session.mode,
      score: scoreOf(session),
      accuracy: session.attempted ? session.correct / session.attempted : 0,
      durationSec: Math.max(0, Math.round((end - session.startedAt.getTime()) / 1000)),
      missed,
    };
  }

  private async insertQuestions(
    session: SessionRow,
    count: number,
    startPosition: number,
    previous?: QuestionRow,
  ): Promise<QuestionDto[]> {
    const generated = generateQuestions(session.config, count, {
      table: session.mode.kind === 'table',
      rng: this.rng,
      previous,
    });
    const rows = await this.db
      .insert(sessionQuestions)
      .values(generated.map((q, i) => ({ ...q, sessionId: session.id, position: startPosition + i })))
      .returning();
    return rows.sort((a, b) => a.position - b.position).map(toQuestionDto);
  }

  private async loadSession(id: string, token: string): Promise<SessionRow> {
    if (!UUID.test(id)) throw notFound();
    const [session] = await this.db.select().from(quizSessions).where(eq(quizSessions.id, id));
    if (!session || !tokensMatch(session.token, token)) throw notFound();
    return session;
  }

  private async loadQuestion(sessionId: string, questionId: string): Promise<QuestionRow> {
    const [question] = await this.db
      .select()
      .from(sessionQuestions)
      .where(and(eq(sessionQuestions.id, questionId), eq(sessionQuestions.sessionId, sessionId)));
    if (!question) throw new HttpError(404, 'question_not_found', 'Question not found');
    return question;
  }

  private assertActive(session: SessionRow): void {
    if (session.finishedAt) throw new HttpError(409, 'finished', 'This session has finished');
    if (session.endsAt && this.now().getTime() > session.endsAt.getTime() + TIMER_GRACE_MS) {
      throw new HttpError(409, 'expired', "Time's up for this session");
    }
  }
}

function tokensMatch(expected: string, given: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

function scoreOf(session: Pick<SessionRow, 'correct' | 'attempted'>) {
  return { correct: session.correct, attempted: session.attempted };
}

function grade(
  question: QuestionRow,
  answers: Partial<Record<Person, string>>,
  strictFadas: boolean,
): CellResult[] {
  const verb = getVerb(question.lemma)!;
  return question.persons.map((person) => {
    const { answers: accepted, steps } = conjugate(verb, question.tense, question.form, person)!;
    const check = checkAnswer(answers[person] ?? '', accepted, { strictFadas });
    return {
      person,
      correct: check.correct,
      expected: check.expected,
      accepted,
      fadaWarning: check.fadaWarning,
      fadaOnly: check.fadaOnly,
      steps,
    };
  });
}

function toQuestionDto(row: QuestionRow): QuestionDto {
  const verb = getVerb(row.lemma)!;
  return {
    id: row.id,
    position: row.position,
    lemma: row.lemma,
    tense: row.tense,
    form: row.form,
    persons: row.persons,
    english: row.persons.map((p) => englishSentence(verb, row.tense, row.form, p)),
  };
}

function toSessionDto(session: SessionRow, questions: QuestionDto[]): SessionDto {
  return {
    id: session.id,
    token: session.token,
    mode: session.mode,
    config: session.config,
    strictFadas: session.strictFadas,
    startedAt: session.startedAt.toISOString(),
    endsAt: session.endsAt?.toISOString() ?? null,
    questions,
  };
}
