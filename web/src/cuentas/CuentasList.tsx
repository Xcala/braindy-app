import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { cuentasApi, money, errKey, monthName, openUrl, type Cuenta, type Profile } from './api';
import { SendDialog } from './admin/SendDialog';
import { PaidDialog } from './PaidDialog';

const CHIP: Record<string, string> = { scheduled: 'c-draft', issued: 'c-sent', sent: 'c-sent', paid: 'c-approved', overdue: 'c-lost', void: 'c-archived', held: 'c-approve' };

/** The cuentas and recibos of a brand as a list: number, month, value, status, PDF. The client says «Ya pagué»;
 *  the admin issues, sends, voids and confirms proofs. */
export function CuentasList({ brandId, docs, admin, reload, sendTo }: { brandId: string; docs: Cuenta[]; admin?: boolean; reload: () => void; sendTo?: { profile: Profile | null; people: number } }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState<Cuenta | null>(null);
  const [voiding, setVoiding] = useState<Cuenta | null>(null);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState<Cuenta | null>(null);

  async function run(id: string, f: () => Promise<unknown>) {
    setBusy(id); setMsg(null);
    try { await f(); reload(); } catch (e) { setMsg(t(errKey(e) as never)); } finally { setBusy(null); }
  }
  if (!docs.length) return <p className="t-sm t-mute">{t('cc.empty')}</p>;
  const cuentas = docs.filter((d) => d.type === 'cuenta_cobro');
  const recibos = docs.filter((d) => d.type === 'recibo');
  const cols = { gridTemplateColumns: '7.5rem minmax(0,1fr) 8rem 9rem minmax(9rem,auto)' };
  // A recibo shows the day it was paid; older ones without it, the month of the payment.
  const dateOf = (d: Cuenta) => !d.paidOn ? monthName(d.billingMonth, lang) : new Date(`${d.paidOn}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const row = (d: Cuenta) => {
    const recibo = d.type === 'recibo';
    // Paid shows as paid; «Para tu ojo» is only for what is waiting to go out. Not sent yet = the client does not see it.
    const st = d.status === 'paid' ? 'paid' : d.held && d.status !== 'void' && d.status !== 'scheduled' ? 'held' : d.status;
    const pending = d.payments.find((p) => p.status === 'pending');
    const open = ['issued', 'sent', 'overdue'].includes(d.status);
    const canSend = admin && d.held && d.status !== 'void' && d.status !== 'scheduled';
    return (
      <div key={d.id} className="trow min-w-[40rem]" style={{ ...cols, alignItems: 'center' }}>
        <span className="w7">{d.number}</span>
        <span className="col g2" style={{ minWidth: 0 }}>
          <span className="t-sm">{recibo ? dateOf(d) : monthName(d.billingMonth, lang)}</span>
          <span className="t-xs t-mute">{recibo ? t('cc.covers', { list: d.covers.map((c) => c.number).join(', ') || '—' }) : t('cc.cuenta', { i: d.index, n: d.of })}{admin && d.status === 'scheduled' ? ` · ${t('cc.a.on', { day: d.scheduledDate })}` : ''}</span>
          {d.voidReason && <span className="t-xs t-mute">{d.voidReason}</span>}
        </span>
        <span className="col g2"><span className="t-sm w7">{money(d.amount, d.currency)}</span>{d.paid > 0 && d.status !== 'paid' && !recibo && <span className="t-xs t-mute">{t('cc.paidPart', { v: money(d.paid, d.currency) })}</span>}</span>
        <span className="col g2"><span><span className={`chip ${CHIP[st]}`}>{t(recibo && st === 'sent' ? 'cc.st.delivered' : `cc.st.${st}` as never)}</span></span>
          {pending && <span className="t-xs t-mute">{t('cc.pending')}</span>}
          {admin && d.held && st === 'paid' && <span className="t-xs t-mute">{t('cc.notSent')}</span>}</span>
        <span className="row g8 wrap" style={{ justifyContent: 'flex-end' }}>
          {d.hasPdf && <button className="btn btn-ghost btn-sm" onClick={() => openUrl(admin ? cuentasApi.adminPdf(brandId, d.id) : cuentasApi.pdf(brandId, d.id))}>{t('cc.pdf')}</button>}
          {!admin && open && !recibo && !pending && <button className="btn btn-secondary btn-sm" onClick={() => setPaying(d)}>{t('cc.iPaid')}</button>}
          {admin && d.status === 'scheduled' && <button className="btn btn-secondary btn-sm" disabled={busy === d.id} onClick={() => run(d.id, () => cuentasApi.act(brandId, d.id, 'issue'))}>{t('cc.a.issue')}</button>}
          {canSend && <button className="btn btn-primary btn-sm" disabled={busy === d.id} onClick={() => setSending(d)}>{t('cc.a.send')}</button>}
          {admin && pending?.hasProof && <button className="btn btn-ghost btn-sm" onClick={() => openUrl(cuentasApi.proof(brandId, d.id, pending.id))}>{t('cc.a.seeProof')}</button>}
          {admin && pending && <button className="btn btn-primary btn-sm" disabled={busy === d.id} onClick={() => run(d.id, () => cuentasApi.confirm(brandId, d.id, pending.id))}>{t('cc.a.confirm')}</button>}
          {admin && !recibo && d.status !== 'void' && d.status !== 'paid' && d.paid === 0 && <button className="btn btn-ghost btn-sm" onClick={() => { setVoiding(d); setReason(''); }}>{t('cc.a.void')}</button>}
        </span>
      </div>
    );
  };
  const table = (list: Cuenta[], second: string) => (
    <div className="table overflow-x-auto">
      <div className="trow head label min-w-[40rem]" style={cols}>
        <span>{t('cc.col.number')}</span><span>{second}</span><span>{t('cc.col.value')}</span><span>{t('cc.col.status')}</span><span />
      </div>
      {list.map(row)}
    </div>
  );

  return (
    <div className="col g16">
      {msg && <p className="t-sm" role="status">{msg}</p>}
      {cuentas.length > 0 && <div className="col g8"><p className="label">{t('cc.h.cuentas')}</p>{table(cuentas, t('cc.col.month'))}</div>}
      {recibos.length > 0 && <div className="col g8"><p className="label">{t('cc.h.recibos')}</p>{table(recibos, t('cc.col.paidOn'))}</div>}
      {sending && <SendDialog brandId={brandId} doc={sending} profile={sendTo?.profile ?? null} people={sendTo?.people ?? 0} onClose={(sent) => { setSending(null); if (sent) reload(); }} />}
      {paying && <PaidDialog brandId={brandId} doc={paying} onClose={() => { setPaying(null); reload(); }} />}
      {voiding && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setVoiding(null)}>
          <div className="modal w-full max-w-[28rem] col g12" role="dialog" aria-modal="true" aria-labelledby="void-h">
            <h2 className="h2" id="void-h">{t('cc.a.void')} {voiding.number}</h2>
            <div className="field"><label htmlFor="void-r">{t('cc.a.voidQ')}</label><input id="void-r" className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <div className="row g12" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setVoiding(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" disabled={!reason.trim()} onClick={() => { const d = voiding; setVoiding(null); run(d.id, () => cuentasApi.act(brandId, d.id, 'void', reason)); }}>{t('cc.a.voidOk')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
