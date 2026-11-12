import { useI18n } from '../i18n/I18nProvider';

/** Step 6 (design 17): for two weeks after going live, Home opens with "your brand system is live". */
export function LiveBanner({ liveAt }: { liveAt?: Date | null }) {
  const { t } = useI18n();
  if (!liveAt || Date.now() - liveAt.getTime() > 14 * 864e5) return null;
  return (
    <section className="stage col g12 rounded-[1.25rem] p-6 sm:p-9" aria-labelledby="h-live">
      <p className="label">{t('home.liveKicker')}</p>
      <h1 className="d-lg" id="h-live" style={{ color: '#fff' }}><span className="w9">{t('home.live1')}</span> {t('home.live2')}</h1>
      <p className="t-lg muted">{t('home.liveSub')}</p>
    </section>
  );
}
