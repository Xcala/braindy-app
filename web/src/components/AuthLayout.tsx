import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';

/** Split layout from the design: brand stage on the left (desktop only), content on the right. */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-full bg-white p-0 lg:p-6">
      <section className="stage hidden w-[660px] flex-none flex-col justify-between rounded-[20px] px-14 pb-10 pt-12 lg:flex">
        <img src="/brand/braindy-logo-light.svg" alt="Braindy" className="h-[34px] w-auto self-start" />
        <div className="col g20" style={{ maxWidth: 500 }}>
          <p className="label">{t('login.kicker')}</p>
          <h1 className="d-xl" style={{ color: '#fff', fontSize: 60, lineHeight: '62px' }}>
            <span className="w9">{t('login.hero1')}</span> {t('login.hero2')}
          </h1>
          <p className="t-lg muted" style={{ maxWidth: 430 }}>{t('login.heroBody')}</p>
        </div>
        <div className="col g16">
          <img className="lighten" src="/brand/brains/four-brains.jpg" alt={t('login.brainsAlt')} style={{ width: '100%', height: 'auto', display: 'block' }} />
          <div className="rule-line" />
          <p className="kicker" style={{ fontSize: 18, lineHeight: '24px' }}>
            <b>{t('login.line1')}</b> {t('login.line2')}
          </p>
        </div>
      </section>
      <section className="flex flex-1 flex-col px-4 py-4 sm:px-8 lg:pl-16">
        <div className="flex items-center justify-between lg:justify-end">
          <img src="/brand/braindy-logo.svg" alt="Braindy" className="h-7 w-auto lg:hidden" />
          <LangToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
        <p className="t-xs t-mute text-center">app.braindy.co</p>
      </section>
    </div>
  );
}
