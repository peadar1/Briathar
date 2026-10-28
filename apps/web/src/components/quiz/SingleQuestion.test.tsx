import { conjugate, getVerb } from '@briathra/conjugator';
import type { AnswerResultDto, QuestionDto } from '@briathra/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SingleQuestion } from './SingleQuestion';

const question: QuestionDto = {
  id: '00000000-0000-4000-8000-000000000001',
  position: 0,
  lemma: 'téigh',
  tense: 'past',
  form: 'negative',
  persons: ['sg1'],
  english: ["I didn't go"],
};

const accepted = conjugate(getVerb('téigh')!, 'past', 'negative', 'sg1')!;

function grade(answer: string): AnswerResultDto {
  const correct = answer === accepted.answers[0];
  return {
    questionId: question.id,
    results: [
      {
        person: 'sg1',
        correct,
        expected: accepted.answers[0]!,
        accepted: accepted.answers,
        fadaWarning: false,
        fadaOnly: false,
        steps: accepted.steps,
      },
    ],
    score: { correct: correct ? 1 : 0, attempted: 1 },
  };
}

function setup() {
  const onSubmit = vi.fn(async (answers: Record<string, string>) => grade(answers.sg1 ?? ''));
  const onAdvance = vi.fn();
  render(
    <SingleQuestion
      question={question}
      promptType="grammar"
      strictFadas
      onSubmit={onSubmit}
      onAdvance={onAdvance}
    />,
  );
  return { onSubmit, onAdvance, user: userEvent.setup(), input: screen.getByRole('textbox') };
}

describe('SingleQuestion', () => {
  it('shows the grammar prompt', () => {
    setup();
    expect(screen.getByText('téigh')).toBeInTheDocument();
    expect(screen.getByText('Aimsir Chaite')).toBeInTheDocument();
    expect(screen.getByText('Diúltach')).toBeInTheDocument();
  });

  it('requires retyping the correct answer after a mistake', async () => {
    const { onSubmit, onAdvance, user, input } = setup();

    await user.type(input, 'níor chuaigh mé{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({ sg1: 'níor chuaigh mé' });
    expect(await screen.findByText('Not quite.')).toBeInTheDocument();
    expect(screen.getByText(/dependent past tense form "deachaigh"/)).toBeInTheDocument();

    await user.type(input, 'ní chuaigh mé{Enter}');
    expect(onAdvance).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, 'ní dheachaigh mé{Enter}');
    expect(onAdvance).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('advances after a correct answer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { onAdvance, user, input } = setup();
    await user.type(input, 'ní dheachaigh mé{Enter}');
    expect(await screen.findByText('Ceart! Correct!')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(1000);
    expect(onAdvance).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
