import { useI18n } from '../i18n/I18nProvider';
import type { BrandRequest } from './types';

/**
 * The brand's pace in one line under the title: typical days from asking to approved over the last 90 days, and the
 * share approved at the first version. Sells the outcome; hidden until there are at least three to average.
 */
export function DeliveryPace({ list }: { list: BrandRequest[] }) {
  const { t } = useI18n();
  const since = Date.now() - 90 * 864e5;
  const done = list.filter((r) => r.approvedAt && r.createdAt && r.approvedAt.toMillis() >= since && r.approvedAt.toMillis() >= r.createdAt.toMillis());
  if (done.length < 3) return null;
  const days = done.map((r) => (r.approvedAt!.toMillis() - r.createdAt!.toMillis()) / 864e5).sort((a, b) => a - b);
  const median = Math.max(1, Math.round(days[Math.floor(days.length / 2)]));
  const first = Math.round((done.filter((r) => (r.versionCount ?? 1) <= 1).length / done.length) * 100);
  return <p className="t-sm t-mute" style={{ margin: 0 }}>{t('rp.line', { days: t(median === 1 ? 'rp.day' : 'rp.days', { n: median }), pct: first })}</p>;
}
