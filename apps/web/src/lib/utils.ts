import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shakes an element without re-rendering it (so the input keeps focus). */
export function shake(element: HTMLElement | null) {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  element?.animate?.(
    [0, -6, 6, -6, 6, 0].map((x) => ({ transform: `translateX(${x}px)` })),
    { duration: 400, easing: 'ease-in-out' },
  );
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Storage can throw in private windows or when site data is blocked. */
export const safeStorage = {
  get(storage: 'local' | 'session', key: string): string | null {
    try {
      return (storage === 'local' ? localStorage : sessionStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(storage: 'local' | 'session', key: string, value: string): void {
    try {
      (storage === 'local' ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      // Non-essential: the app works without persistence.
    }
  },
  remove(storage: 'local' | 'session', key: string): void {
    try {
      (storage === 'local' ? localStorage : sessionStorage).removeItem(key);
    } catch {
      // ignore
    }
  },
};
