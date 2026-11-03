import { useI18n } from '../i18n/I18nProvider';
import type { BrandRequest } from './types';

/**
 * The brand's pace in plain words: how many days from asking to approved, on average over the last 90 days, and how
 * many were approved at the first version. Sells the outcome; hidden until there are at least three to average.
 */
export function DeliveryPace({ list }: { list: BrandRequest[] }) {
  const { t } = useI18n();
  const since = Date.now() - 90 * 864e5;
  const done = list.filter((r) => r.approvedAt && r.createdAt && r.approvedAt.toMillis() >= since && r.approvedAt.toMillis() >= r.createdAt.toMillis());
  if (done.length < 3) return null;
  const days = done.map((r) => (r.approvedAt!.toMillis() - r.createdAt!.toMillis()) / 864e5).sort((a, b) => a - b);
  const median = Math.max(1, Math.round(days[Math.floor(days.length / 2)]));
  const first = Math.round((done.filter((r) => (r.versionCount ?? 1) <= 1).length / done.length) * 100);
  return (
    <div className="card row g24 wrap" style={{ padding: '18px 24px' }} aria-label={t('rp.label')}>
      <span className="col g4"><span className="label">{t('rp.label')}</span><span className="t-sm t-mute">{t('rp.sub', { n: done.length })}</span></span>
      <span className="col"><span className="w9" style={{ fontSize: 32, lineHeight: '36px', letterSpacing: '-.03em' }}>{t(median === 1 ? 'rp.day' : 'rp.days', { n: median })}</span><span className="t-xs t-mute">{t('rp.toApproved')}</span></span>
      <span className="col"><span className="w9" style={{ fontSize: 32, lineHeight: '36px', letterSpacing: '-.03em' }}>{first}%</span><span className="t-xs t-mute">{t('rp.firstTry')}</span></span>
    </div>
  );
}
