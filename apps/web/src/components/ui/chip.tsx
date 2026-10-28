import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** A checkbox styled as a pill. */
export function Chip({
  checked,
  onChange,
  children,
  lang,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  lang?: string;
}) {
  return (
    <label
      lang={lang}
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
        checked
          ? 'border-primary bg-primary-soft text-ink'
          : 'border-line bg-surface text-ink-muted hover:border-ink-muted/40 hover:text-ink',
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {checked && <Check className="size-3.5 text-primary" aria-hidden />}
      {children}
    </label>
  );
}
