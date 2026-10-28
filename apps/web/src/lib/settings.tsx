import type { PromptType } from '@briathra/shared';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { safeStorage } from './utils';

export type Theme = 'system' | 'light' | 'dark';
export type Language = 'en' | 'ga';

export interface Settings {
  theme: Theme;
  language: Language;
  strictFadas: boolean;
  promptType: PromptType;
}

const DEFAULTS: Settings = { theme: 'system', language: 'en', strictFadas: true, promptType: 'grammar' };
const STORAGE_KEY = 'briathra.settings';

function loadSettings(): Settings {
  const raw = safeStorage.get('local', STORAGE_KEY);
  if (!raw) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function prefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const { i18n } = useTranslation();

  useEffect(() => {
    safeStorage.set('local', STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    void i18n.changeLanguage(settings.language);
    document.documentElement.lang = settings.language;
  }, [i18n, settings.language]);

  useEffect(() => {
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark());
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    if (settings.theme !== 'system' || typeof matchMedia !== 'function') return;
    const query = matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [settings.theme]);

  const value = useMemo(
    () => ({ settings, update: (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })) }),
    [settings],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
