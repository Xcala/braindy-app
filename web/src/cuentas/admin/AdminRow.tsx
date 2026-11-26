import { useI18n } from '../../i18n/I18nProvider';
import { money, monthName, shortDate, type Cuenta } from '../api';
import { RowMenu, type MenuItem } from './RowMenu';

const CHIP: Record<string, string> = { scheduled: 'c-draft', issued: 'c-sent', sent: 'c-sent', paid: 'c-approved', overdue: 'c-lost', void: 'c-archived', held: 'c-draft', paidHeld: 'c-approved' };
export const sendable = (d: Cuenta) => d.held && d.status !== 'void' && d.status !== 'scheduled';

export type RowActions = {
  pdf: (d: Cuenta) => void; send: (d: Cuenta) => void; issue: (d: Cuenta) => void; confirm: (d: Cuenta, paymentId: string) => void;
  proof: (d: Cuenta, paymentId: string) => void; markPaid: (d: Cuenta) => void; overdue: (d: Cuenta, on: boolean) => void;
  schedule: (d: Cuenta) => void; unschedule: (d: Cuenta) => void; void: (d: Cuenta) => void;
};

/** One cuenta or recibo on NickMark's side, one line high: what it is, its value, how it stands (and what will happen
 *  next: «Sale sola el 5 ene»), PDF and the main action in view, the rest in ⋯ with «Anular» last, in red. */
export function AdminRow({ d, busy, act }: { d: Cuenta; busy: boolean; act: RowActions }) {
  const { t, lang } = useI18n();
  const recibo = d.type === 'recibo';
  const open = ['issued', 'sent', 'overdue'].includes(d.status);
  const pending = d.payments.find((p) => p.status === 'pending');
  // One name for «not sent»: grey while it waits, «Pagada · sin enviar» once paid.
  const st = d.status === 'paid' ? (d.held ? 'paidHeld' : 'paid') : sendable(d) ? 'held' : d.status;
  const label = st === 'paidHeld' ? t('pg.r.paidNotSent') : t(recibo && st === 'sent' ? 'cc.st.delivered' : `cc.st.${st}` as never);
  const when = recibo
    ? (d.paidOn ? new Date(`${d.paidOn}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : monthName(d.billingMonth, lang))
    : monthName(d.billingMonth, lang);
  const next = d.status === 'scheduled' ? t(d.held ? 'pg.r.issueOn' : 'pg.r.autoOn', { d: shortDate(d.scheduledDate, lang) })
    : d.sendAt && sendable(d) ? t('pg.r.sendOn', { d: shortDate(d.sendAt, lang) }) : pending ? t('cc.pending') : '';
  const items: MenuItem[] = [
    ...(open && !recibo ? [{ key: 'paid', label: t('cc.mp.paid'), onClick: () => act.markPaid(d) },
      d.status === 'overdue' ? { key: 'ontime', label: t('cc.mp.ontime'), onClick: () => act.overdue(d, false) } : { key: 'late', label: t('cc.mp.overdue'), onClick: () => act.overdue(d, true) }] : []),
    ...(pending?.hasProof ? [{ key: 'proof', label: t('cc.a.seeProof'), onClick: () => act.proof(d, pending.id) }] : []),
    ...(sendable(d) ? [d.sendAt ? { key: 'unsch', label: t('pg.r.unschedule'), onClick: () => act.unschedule(d) } : { key: 'sch', label: t('pg.r.schedule'), onClick: () => act.schedule(d) }] : []),
    ...(!recibo && d.status !== 'void' && d.status !== 'paid' && d.paid === 0 ? [{ key: 'void', label: t('pg.r.voidQ'), danger: true, onClick: () => act.void(d) }] : []),
  ];
  return (
    <div className="cc-r" role="row">
      <span className="cc-r-what" role="cell">
        <span className="t-sm"><b>{d.number}</b> · {when}</span>
        <span className="t-xs t-mute">{recibo ? t('cc.covers', { list: d.covers.map((c) => c.number).join(', ') || '—' }) : t('cc.cuenta', { i: d.index, n: d.of })}{d.voidReason ? ` · ${d.voidReason}` : ''}</span>
      </span>
      <span className="cc-r-val" role="cell"><span className="t-sm w7">{money(d.amount, d.currency)}</span>{d.paid > 0 && d.status !== 'paid' && !recibo && <span className="t-xs t-mute">{t('cc.paidPart', { v: money(d.paid, d.currency) })}</span>}</span>
      <span className="cc-r-st" role="cell"><span className={`chip ${CHIP[st]}`}>{label}</span>{next && <span className={`t-xs ${d.status === 'scheduled' && !d.held ? 'cc-auto' : 't-mute'}`}>{next}</span>}</span>
      <span className="cc-r-act" role="cell">
        {d.hasPdf && <button className="btn btn-ghost btn-sm" onClick={() => act.pdf(d)}>{t('cc.pdf')}</button>}
        {d.status === 'scheduled' && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act.issue(d)}>{t('cc.a.issue')}</button>}
        {pending ? <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act.confirm(d, pending.id)}>{t('cc.a.confirm')}</button>
          : sendable(d) && <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => act.send(d)}>{t('cc.a.send')}</button>}
        <RowMenu label={t('pg.r.more', { n: d.number })} items={items} />
      </span>
    </div>
  );
}
