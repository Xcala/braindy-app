import { useI18n } from '../../i18n/I18nProvider';
import { money, type Agreement, type Cuenta } from '../api';

/** What has been paid on a project: the paid part of its cuentas that are not void. */
export const paidOf = (agreement: Agreement, docs: Cuenta[]) =>
  docs.filter((d) => d.agreementId === agreement.id && d.type === 'cuenta_cobro' && d.status !== 'void').reduce((s, d) => s + (d.paid ?? 0), 0);
const pct = (n: number, total: number) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0);

/** «Registrar un pago»: one line with what is left (the bars are already right above) and what this payment makes it. */
export function PayProgress({ agreement, docs, next }: { agreement: Agreement; docs: Cuenta[]; next: number }) {
  const { t } = useI18n();
  const cur = agreement.currency;
  const total = agreement.totalAmount;
  const paid = paidOf(agreement, docs);
  const left = Math.max(0, total - paid);
  const add = Math.min(Math.max(0, next), left);
  const pAfter = pct(paid + add, total);

  return (
    <p className="t-sm" style={{ margin: 0 }}>
      <b>{t('pg.a.payLeft', { v: money(left, cur) })}</b>{' '}
      <span className="t-mute">{add > 0 ? t('cc.pr.after', { p: String(pAfter), left: money(left - add, cur) }) : ''}{next > left && left > 0 ? ` ${t('cc.pr.over', { v: money(next - left, cur) })}` : ''}</span>
    </p>
  );
}
