export interface CheckOptions {
  /** When false, an answer that is right apart from fadas is accepted with a warning. */
  strictFadas: boolean;
}

export interface CheckResult {
  correct: boolean;
  /** The accepted answer closest to what was typed (or the canonical answer if none matched). */
  expected: string;
  /** Accepted, but one or more fadas were missing or wrong (lenient mode only). */
  fadaWarning: boolean;
  /** Rejected only because of fadas (strict mode only). */
  fadaOnly: boolean;
}

export function normaliseAnswer(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/'\s+/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[?.!]+$/, '')
    .trim();
}

export function stripFadas(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

export function checkAnswer(input: string, answers: string[], options: CheckOptions): CheckResult {
  const typed = normaliseAnswer(input);
  const canonical = answers[0] ?? '';

  const exact = answers.find((a) => normaliseAnswer(a) === typed);
  if (exact) return { correct: true, expected: exact, fadaWarning: false, fadaOnly: false };

  const typedBare = stripFadas(typed);
  const loose = answers.find((a) => stripFadas(normaliseAnswer(a)) === typedBare);
  if (loose) {
    return options.strictFadas
      ? { correct: false, expected: loose, fadaWarning: false, fadaOnly: true }
      : { correct: true, expected: loose, fadaWarning: true, fadaOnly: false };
  }
  return { correct: false, expected: canonical, fadaWarning: false, fadaOnly: false };
}
