import * as Dialog from '@radix-ui/react-dialog';
import { Settings as SettingsIcon, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, type Language, type Theme } from '../lib/settings';
import { Button } from './ui/button';
import { Segmented } from './ui/segmented';

export function SettingsDialog() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('settings.title')}>
          <SettingsIcon />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-6 shadow-xl"
        >
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="font-serif text-xl font-semibold">{t('settings.title')}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label={t('settings.close')}>
                <X />
              </Button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            <Field label={t('settings.language')}>
              <Segmented<Language>
                label={t('settings.language')}
                value={settings.language}
                onChange={(language) => update({ language })}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ga', label: 'Gaeilge' },
                ]}
              />
            </Field>
            <Field label={t('settings.theme')}>
              <Segmented<Theme>
                label={t('settings.theme')}
                value={settings.theme}
                onChange={(theme) => update({ theme })}
                options={[
                  { value: 'system', label: t('settings.system') },
                  { value: 'light', label: t('settings.light') },
                  { value: 'dark', label: t('settings.dark') },
                ]}
              />
            </Field>
            <Field label={t('setup.fadas')}>
              <Segmented
                label={t('setup.fadas')}
                value={settings.strictFadas ? 'strict' : 'lenient'}
                onChange={(v) => update({ strictFadas: v === 'strict' })}
                options={[
                  { value: 'strict', label: t('setup.strict') },
                  { value: 'lenient', label: t('setup.lenient') },
                ]}
              />
            </Field>
            <Field label={t('setup.prompt')}>
              <Segmented
                label={t('setup.prompt')}
                value={settings.promptType}
                onChange={(promptType) => update({ promptType })}
                options={[
                  { value: 'grammar', label: t('setup.grammar') },
                  { value: 'english', label: t('setup.english') },
                ]}
              />
            </Field>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-ink-muted">{label}</div>
      {children}
    </div>
  );
}
