import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { SettingsDialog } from './SettingsDialog';

export function Layout() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line/70 bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          <SettingsDialog />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-line/70 py-6">
        <p className="mx-auto max-w-5xl px-4 text-center text-xs text-ink-muted">{t('footer.data')}</p>
      </footer>
    </div>
  );
}
