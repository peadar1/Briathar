import { forwardRef, useImperativeHandle, useRef, type ComponentProps, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const FADA_VOWELS = ['á', 'é', 'í', 'ó', 'ú'] as const;
const FADA_BY_CODE: Record<string, string> = { KeyA: 'á', KeyE: 'é', KeyI: 'í', KeyO: 'ó', KeyU: 'ú' };

/** Inserts text at the caret (replacing any selection) and returns the new value and caret position. */
export function insertAt(value: string, start: number, end: number, text: string) {
  return { value: value.slice(0, start) + text + value.slice(end), caret: start + text.length };
}

type FadaInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  value: string;
  onValueChange: (value: string) => void;
  showKeys?: boolean;
};

export const FadaInput = forwardRef<HTMLInputElement, FadaInputProps>(function FadaInput(
  { value, onValueChange, showKeys = true, className, onKeyDown, ...props },
  forwardedRef,
) {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => ref.current!);

  const insert = (text: string) => {
    const input = ref.current;
    if (!input) return;
    const { value: next, caret } = insertAt(
      value,
      input.selectionStart ?? value.length,
      input.selectionEnd ?? value.length,
      text,
    );
    onValueChange(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(caret, caret);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Alt + vowel types a fada. Ctrl+Alt (AltGr) is left alone: Irish keyboard layouts use it natively.
    const fada = FADA_BY_CODE[event.code];
    if (event.altKey && !event.ctrlKey && !event.metaKey && fada) {
      event.preventDefault();
      insert(event.shiftKey ? fada.toUpperCase() : fada);
      return;
    }
    onKeyDown?.(event);
  };

  return (
    <div className="w-full">
      <input
        ref={ref}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        lang="ga"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className={cn(
          'h-14 w-full rounded-xl border border-line bg-surface px-4 text-lg text-ink shadow-inner outline-none transition-colors placeholder:text-ink-muted/60 focus:border-primary focus-visible:outline-none focus:ring-2 focus:ring-primary/25',
          className,
        )}
        {...props}
      />
      {showKeys && (
        <div role="group" aria-label={t('quiz.fadaKeys')} className="mt-2 flex gap-1.5">
          {FADA_VOWELS.map((vowel) => (
            <button
              key={vowel}
              type="button"
              tabIndex={-1}
              aria-label={t('quiz.insertFada', { letter: vowel })}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(vowel)}
              disabled={props.disabled}
              className="h-10 min-w-11 rounded-lg border border-line bg-surface-muted text-lg font-medium text-ink transition-colors hover:border-primary hover:bg-primary-soft disabled:opacity-50"
            >
              {vowel}
            </button>
          ))}
          <span className="ml-auto hidden self-center text-xs text-ink-muted sm:inline">Alt + a/e/i/o/u</span>
        </div>
      )}
    </div>
  );
});
