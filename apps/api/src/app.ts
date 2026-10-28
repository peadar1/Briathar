import rateLimit from '@fastify/rate-limit';
import { answerSchema, createSessionSchema } from '@briathra/shared';
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import type { Db } from './db/client.js';
import { HttpError } from './errors.js';
import type { Rng } from './quiz/generator.js';
import { QuizService } from './quiz/service.js';

export interface AppOptions {
  db: Db;
  logger?: boolean;
  now?: () => Date;
  rng?: Rng;
}

function sessionToken(request: FastifyRequest): string {
  const token = request.headers['x-session-token'];
  return typeof token === 'string' ? token : '';
}

export async function buildApp({ db, logger = false, now, rng }: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger, bodyLimit: 16 * 1024 });
  const quiz = new QuizService(db, now, rng);

  await app.register(rateLimit, { max: 600, timeWindow: '1 minute' });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: 'invalid_request', message: error.issues[0]?.message ?? 'Invalid request' });
    }
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ error: error.code, message: error.message });
    }
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      return reply.status(status).send({ error: 'request_error', message: (error as Error).message });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'internal', message: 'Something went wrong' });
  });

  app.get('/api/health', async () => ({ ok: true }));

  app.post('/api/sessions', async (request, reply) => {
    const session = await quiz.createSession(createSessionSchema.parse(request.body));
    return reply.status(201).send(session);
  });

  app.post<{ Params: { id: string } }>('/api/sessions/:id/questions', async (request) =>
    quiz.moreQuestions(request.params.id, sessionToken(request)),
  );

  app.post<{ Params: { id: string } }>('/api/sessions/:id/answers', async (request) =>
    quiz.answer(request.params.id, sessionToken(request), answerSchema.parse(request.body)),
  );

  app.post<{ Params: { id: string } }>('/api/sessions/:id/finish', async (request) =>
    quiz.finish(request.params.id, sessionToken(request)),
  );

  return app;
}
