import type {
  AnswerRequest,
  AnswerResultDto,
  ApiError,
  CreateSessionRequest,
  QuestionDto,
  SessionDto,
  SessionSummaryDto,
} from '@briathra/shared';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body) headers['content-type'] = 'application/json';
  if (init.token) headers['x-session-token'] = init.token;

  const response = await fetch(`/api${path}`, { ...init, headers });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(response.status, body?.error ?? 'network', body?.message ?? response.statusText);
  }
  return (await response.json()) as T;
}

export const api = {
  createSession: (body: CreateSessionRequest) =>
    request<SessionDto>('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  moreQuestions: (session: Pick<SessionDto, 'id' | 'token'>) =>
    request<QuestionDto[]>(`/sessions/${session.id}/questions`, { method: 'POST', token: session.token }),
  answer: (session: Pick<SessionDto, 'id' | 'token'>, body: AnswerRequest) =>
    request<AnswerResultDto>(`/sessions/${session.id}/answers`, {
      method: 'POST',
      token: session.token,
      body: JSON.stringify(body),
    }),
  finish: (session: Pick<SessionDto, 'id' | 'token'>) =>
    request<SessionSummaryDto>(`/sessions/${session.id}/finish`, { method: 'POST', token: session.token }),
};
