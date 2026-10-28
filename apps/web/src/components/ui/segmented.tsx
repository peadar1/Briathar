import { useId } from 'react';
import { cn } from '../../lib/utils';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

/** Radio group styled as a segmented control; arrow keys move between options natively. */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex-1 cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
              option.value === value
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
