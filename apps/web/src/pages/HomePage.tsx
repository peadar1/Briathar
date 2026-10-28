import { PRESETS } from '@briathra/shared';
import { ArrowRight, Keyboard, Lightbulb, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export function HomePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ga' ? 'ga' : 'en';

  return (
    <div className="space-y-14">
      <section className="max-w-2xl">
        <p lang="ga" className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {t('home.eyebrow')}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-balance sm:text-5xl">
          {t('home.title')}
        </h1>
        <p className="mt-4 text-lg text-ink-muted text-pretty">{t('home.subtitle')}</p>
      </section>

      <section aria-labelledby="presets-heading">
        <h2 id="presets-heading" className="font-serif text-2xl font-semibold">
          {t('home.presetsTitle')}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((preset) => (
            <Link
              key={preset.id}
              to={`/setup?preset=${preset.id}`}
              className="group rounded-2xl focus-visible:outline-offset-4"
            >
              <Card className="flex h-full flex-col p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md">
                <h3 lang="ga" className="font-serif text-lg font-semibold">
                  {preset.title.ga}
                </h3>
                {lang === 'en' && <p className="text-sm text-ink-muted">{preset.title.en}</p>}
                <p className="mt-3 flex-1 text-sm text-ink-muted">{preset.description[lang]}</p>
                <p className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{t('home.verbs', { count: preset.config.lemmas.length })}</span>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
                </p>
              </Card>
            </Link>
          ))}
          <Card className="flex flex-col border-dashed bg-transparent p-5 shadow-none">
            <SlidersHorizontal className="size-5 text-accent" aria-hidden />
            <h3 className="mt-2 font-serif text-lg font-semibold">{t('home.customTitle')}</h3>
            <p className="mt-2 flex-1 text-sm text-ink-muted">{t('home.customBody')}</p>
            <Button asChild variant="secondary" className="mt-4 self-start">
              <Link to="/setup">{t('home.customCta')}</Link>
            </Button>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Feature icon={<Lightbulb />} title={t('home.features.explainTitle')} body={t('home.features.explainBody')} />
        <Feature icon={<ShieldCheck />} title={t('home.features.accurateTitle')} body={t('home.features.accurateBody')} />
        <Feature icon={<Keyboard />} title={t('home.features.fadaTitle')} body={t('home.features.fadaBody')} />
      </section>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary [&_svg]:size-5">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
    </div>
  );
}
