import { conjugate, getVerb } from '@briathra/conjugator';
import type { AnswerResultDto, QuestionDto, SessionDto, SessionSummaryDto } from '@briathra/shared';
import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { connect, type DbHandle } from '../src/db/client.js';
import { seededRng } from '../src/quiz/generator.js';
import { QUESTION_BATCH, TIMER_GRACE_MS } from '../src/quiz/service.js';

let handle: DbHandle;
let app: FastifyInstance;
let clock: number;

const config = {
  lemmas: ['téigh', 'ól', 'faigh'],
  tenses: ['past', 'future'],
  forms: ['affirmative', 'negative'],
  persons: ['sg1', 'pl1', 'auto'],
};

beforeAll(async () => {
  handle = await connect({});
});

afterAll(async () => {
  await handle.close();
});

beforeEach(async () => {
  await handle.db.execute(sql`truncate table quiz_sessions cascade`);
  clock = Date.parse('2026-10-28T12:00:00Z');
  app = await buildApp({ db: handle.db, now: () => new Date(clock), rng: seededRng(42) });
});

afterEach(async () => {
  await app.close();
});

async function createSession(mode: object, strictFadas = true): Promise<SessionDto> {
  const res = await app.inject({ method: 'POST', url: '/api/sessions', payload: { config, mode, strictFadas } });
  expect(res.statusCode).toBe(201);
  return res.json();
}

function answerFor(q: QuestionDto, person = q.persons[0]!): string {
  return conjugate(getVerb(q.lemma)!, q.tense, q.form, person)!.answers[0]!;
}

function submit(session: SessionDto, questionId: string, answers: Record<string, string>, token = session.token) {
  return app.inject({
    method: 'POST',
    url: `/api/sessions/${session.id}/answers`,
    headers: { 'x-session-token': token },
    payload: { questionId, answers },
  });
}

describe('quiz sessions', () => {
  it('creates a fixed session without leaking answers', async () => {
    const session = await createSession({ kind: 'fixed', questionCount: 10 });
    expect(session.questions).toHaveLength(10);
    expect(session.endsAt).toBeNull();
    const q = session.questions[0]!;
    expect(Object.keys(q).sort()).toEqual(['english', 'form', 'id', 'lemma', 'persons', 'position', 'tense']);
    expect(JSON.stringify(session.questions)).not.toContain('"answers"');
  });

  it('rejects invalid configs', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: { config: { ...config, lemmas: ['notaverb'] }, mode: { kind: 'practice' }, strictFadas: true },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: 'invalid_request' });
  });

  it('scores correct and incorrect answers with explanations', async () => {
    const session = await createSession({ kind: 'fixed', questionCount: 10 });
    const [first, second] = session.questions;

    const right = await submit(session, first!.id, { [first!.persons[0]!]: answerFor(first!) });
    expect(right.json<AnswerResultDto>()).toMatchObject({ results: [{ correct: true }], score: { correct: 1, attempted: 1 } });

    const wrong = await submit(session, second!.id, { [second!.persons[0]!]: 'mícheart' });
    const body = wrong.json<AnswerResultDto>();
    expect(body.results[0]).toMatchObject({ correct: false, expected: answerFor(second!) });
    expect(body.results[0]!.steps.length).toBeGreaterThan(0);
    expect(body.score).toEqual({ correct: 1, attempted: 2 });
  });

  it('only scores the first attempt at a question', async () => {
    const session = await createSession({ kind: 'fixed', questionCount: 10 });
    const q = session.questions[0]!;
    await submit(session, q.id, { [q.persons[0]!]: 'mícheart' });
    const retry = await submit(session, q.id, { [q.persons[0]!]: answerFor(q) });
    expect(retry.json<AnswerResultDto>()).toMatchObject({ results: [{ correct: true }], score: { correct: 0, attempted: 1 } });
  });

  it('applies the fada setting chosen at session start', async () => {
    const lenient = await createSession({ kind: 'fixed', questionCount: 10 }, false);
    const q = lenient.questions.find((x) => /[áéíóú]/.test(answerFor(x)))!;
    const bare = answerFor(q).normalize('NFD').replace(/[̀-ͯ]/g, '');
    const res = await submit(lenient, q.id, { [q.persons[0]!]: bare });
    expect(res.json<AnswerResultDto>().results[0]).toMatchObject({ correct: true, fadaWarning: true });
  });

  it('rejects the wrong session token', async () => {
    const session = await createSession({ kind: 'practice' });
    const res = await submit(session, session.questions[0]!.id, { sg1: 'x' }, 'forged-token');
    expect(res.statusCode).toBe(404);
  });

  it('rejects answers after the timer runs out', async () => {
    const session = await createSession({ kind: 'timed', durationSec: 120 });
    expect(Date.parse(session.endsAt!) - clock).toBe(120_000);
    const q = session.questions[0]!;

    clock += 120_000 + TIMER_GRACE_MS + 1;
    const res = await submit(session, q.id, { [q.persons[0]!]: answerFor(q) });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: 'expired' });
  });

  it('issues more questions in open-ended modes only', async () => {
    const practice = await createSession({ kind: 'practice' });
    const more = await app.inject({
      method: 'POST',
      url: `/api/sessions/${practice.id}/questions`,
      headers: { 'x-session-token': practice.token },
    });
    const batch = more.json<QuestionDto[]>();
    expect(batch).toHaveLength(QUESTION_BATCH);
    expect(batch[0]!.position).toBe(QUESTION_BATCH);

    const fixed = await createSession({ kind: 'fixed', questionCount: 10 });
    const refused = await app.inject({
      method: 'POST',
      url: `/api/sessions/${fixed.id}/questions`,
      headers: { 'x-session-token': fixed.token },
    });
    expect(refused.statusCode).toBe(409);
  });

  it('grades conjugation tables cell by cell', async () => {
    const session = await createSession({ kind: 'table', questionCount: 10 });
    const q = session.questions[0]!;
    expect(q.persons.length).toBeGreaterThan(1);
    const answers = Object.fromEntries(q.persons.map((p, i) => [p, i === 0 ? 'mícheart' : answerFor(q, p)]));
    const body = (await submit(session, q.id, answers)).json<AnswerResultDto>();
    expect(body.results.map((r) => r.correct)).toEqual(q.persons.map((_, i) => i !== 0));
    expect(body.score).toEqual({ correct: q.persons.length - 1, attempted: q.persons.length });
  });

  it('summarises a finished session and blocks further answers', async () => {
    const session = await createSession({ kind: 'timed', durationSec: 120 });
    const [a, b] = session.questions;
    await submit(session, a!.id, { [a!.persons[0]!]: answerFor(a!) });
    await submit(session, b!.id, { [b!.persons[0]!]: 'mícheart' });
    clock += 30_000;

    const finish = await app.inject({
      method: 'POST',
      url: `/api/sessions/${session.id}/finish`,
      headers: { 'x-session-token': session.token },
    });
    const summary = finish.json<SessionSummaryDto>();
    expect(summary).toMatchObject({ score: { correct: 1, attempted: 2 }, accuracy: 0.5, durationSec: 30 });
    expect(summary.missed).toEqual([
      expect.objectContaining({ lemma: b!.lemma, given: 'mícheart', expected: answerFor(b!) }),
    ]);

    const late = await submit(session, session.questions[2]!.id, { [session.questions[2]!.persons[0]!]: 'x' });
    expect(late.json()).toMatchObject({ error: 'finished' });
  });
});
