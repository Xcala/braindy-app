import { useI18n } from '../../i18n/I18nProvider';
import { money, type Agreement, type Cuenta } from '../api';
import '../cuentas.css';

/** What has been paid on a project: the paid part of its cuentas that are not void. */
export const paidOf = (agreement: Agreement, docs: Cuenta[]) =>
  docs.filter((d) => d.agreementId === agreement.id && d.type === 'cuenta_cobro' && d.status !== 'void').reduce((s, d) => s + (d.paid ?? 0), 0);
const pct = (n: number, total: number) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0);

/** How much of a project is paid and how much is left, in money and %, and what this payment would make it. */
export function PayProgress({ agreement, docs, next }: { agreement: Agreement; docs: Cuenta[]; next: number }) {
  const { t } = useI18n();
  const cur = agreement.currency;
  const total = agreement.totalAmount;
  const paid = paidOf(agreement, docs);
  const left = Math.max(0, total - paid);
  const add = Math.min(Math.max(0, next), left);
  const p = pct(paid, total), pAfter = pct(paid + add, total);

  return (
    <div className="col g8">
      <div className="row between g12 wrap t-sm">
        <span><b>{t('cc.pr.paid')}</b> {money(paid, cur)} · <b>{p}%</b></span>
        <span><b>{t('cc.pr.left')}</b> {money(left, cur)} · <b>{100 - p}%</b></span>
      </div>
      <div className="cc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} aria-label={t('cc.pr.label', { p: String(p) })}>
        <span className="is-paid" style={{ width: `${p}%` }} />
        {add > 0 && <span className="is-next" style={{ width: `${pAfter - p}%` }} />}
      </div>
      <p className="t-xs t-mute" style={{ margin: 0 }}>
        {add > 0 ? t('cc.pr.after', { p: String(pAfter), left: money(left - add, cur) }) : t('cc.pr.of', { total: money(total, cur) })}
        {next > left && left > 0 ? ` ${t('cc.pr.over', { v: money(next - left, cur) })}` : ''}
      </p>
    </div>
  );
}
