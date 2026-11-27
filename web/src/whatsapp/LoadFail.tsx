import { useI18n } from '../i18n/I18nProvider';

/** A load error shown as an error, never as an empty list: «Could not load · Retry». */
export function LoadFail({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <p className="wa-fail t-sm" role="alert">
      {t('wa.loadFail')} · <button type="button" className="wa-link" onClick={onRetry}>{t('wa.retry')}</button>
    </p>
  );
}
