import type { CreateSessionRequest, ScoreDto, SessionDto, SessionSummaryDto } from '@briathra/shared';
import { safeStorage } from './utils';

/** Everything needed to resume a quiz after a page reload. */
export interface ActiveQuiz {
  session: SessionDto;
  /** Client clock when the session was created, so the countdown ignores server clock skew. */
  clientStartedAt: number;
  index: number;
  score: ScoreDto;
}

const ACTIVE_KEY = 'briathra.activeQuiz';
const LAST_REQUEST_KEY = 'briathra.lastRequest';
const SUMMARY_KEY = 'briathra.lastSummary';

function read<T>(key: string): T | null {
  const raw = safeStorage.get('session', key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const sessionStore = {
  start(session: SessionDto, request: CreateSessionRequest): ActiveQuiz {
    const quiz: ActiveQuiz = { session, clientStartedAt: Date.now(), index: 0, score: { correct: 0, attempted: 0 } };
    safeStorage.set('session', ACTIVE_KEY, JSON.stringify(quiz));
    safeStorage.set('session', LAST_REQUEST_KEY, JSON.stringify(request));
    return quiz;
  },
  saveActive: (quiz: ActiveQuiz) => safeStorage.set('session', ACTIVE_KEY, JSON.stringify(quiz)),
  active: () => read<ActiveQuiz>(ACTIVE_KEY),
  clearActive: () => safeStorage.remove('session', ACTIVE_KEY),
  lastRequest: () => read<CreateSessionRequest>(LAST_REQUEST_KEY),
  saveSummary: (summary: SessionSummaryDto) =>
    safeStorage.set('session', SUMMARY_KEY, JSON.stringify(summary)),
  summary: () => read<SessionSummaryDto>(SUMMARY_KEY),
};
