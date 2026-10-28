import type { AnswerRequest, AnswerResultDto, QuestionDto } from '@briathra/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiRequestError, api } from '../lib/api';
import { sessionStore, type ActiveQuiz } from '../lib/session-store';

const PREFETCH_THRESHOLD = 3;

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useQuiz(initial: ActiveQuiz) {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const finishing = useRef(false);
  const fetching = useRef(false);

  const { session, index, score, clientStartedAt } = quiz;
  const mode = session.mode;
  const openEnded = mode.kind === 'timed' || mode.kind === 'practice';
  const question: QuestionDto | undefined = session.questions[index];

  useEffect(() => {
    sessionStore.saveActive(quiz);
  }, [quiz]);

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    try {
      sessionStore.saveSummary(await api.finish(session));
      sessionStore.clearActive();
      navigate('/results', { replace: true });
    } catch (e) {
      finishing.current = false;
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [navigate, session]);

  const now = useNow(250);
  const elapsedSec = (now - clientStartedAt) / 1000;
  const remainingSec = mode.kind === 'timed' ? mode.durationSec - elapsedSec : null;

  useEffect(() => {
    if (mode.kind !== 'timed') return;
    const msLeft = clientStartedAt + mode.durationSec * 1000 - Date.now();
    const id = setTimeout(() => void finish(), Math.max(0, msLeft));
    return () => clearTimeout(id);
  }, [mode, clientStartedAt, finish]);

  useEffect(() => {
    if (!openEnded || fetching.current) return;
    if (session.questions.length - index > PREFETCH_THRESHOLD) return;
    fetching.current = true;
    api
      .moreQuestions(session)
      .then((more) =>
        setQuiz((q) => ({ ...q, session: { ...q.session, questions: [...q.session.questions, ...more] } })),
      )
      .catch((e: unknown) => {
        if (e instanceof ApiRequestError && (e.code === 'expired' || e.code === 'finished')) void finish();
      })
      .finally(() => {
        fetching.current = false;
      });
  }, [openEnded, index, session, finish]);

  const submit = useCallback(
    async (answers: AnswerRequest['answers']): Promise<AnswerResultDto | null> => {
      if (!question) return null;
      try {
        const result = await api.answer(session, { questionId: question.id, answers });
        setQuiz((q) => ({ ...q, score: result.score }));
        return result;
      } catch (e) {
        if (e instanceof ApiRequestError && (e.code === 'expired' || e.code === 'finished')) {
          void finish();
          return null;
        }
        throw e;
      }
    },
    [question, session, finish],
  );

  const advance = useCallback(() => {
    const isLast = !openEnded && index + 1 >= session.questions.length;
    if (isLast) void finish();
    else setQuiz((q) => ({ ...q, index: q.index + 1 }));
  }, [openEnded, index, session.questions.length, finish]);

  return { session, question, index, score, elapsedSec, remainingSec, submit, advance, finish, error };
}
