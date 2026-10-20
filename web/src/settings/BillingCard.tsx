import { useI18n } from '../i18n/I18nProvider';

/** Settings · Billing. Filled in by wave G (Stripe). */
export function BillingCard({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  return <div className="card t-mute" data-brand={brandId}>{t('set.billingSoon')}</div>;
}
