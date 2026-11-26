import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { cop, cuentasApi, errKey, monthName, openUrl, type Cuenta } from './api';
import { PaidDialog } from './PaidDialog';

const CHIP: Record<string, string> = { scheduled: 'c-draft', issued: 'c-sent', sent: 'c-sent', paid: 'c-approved', overdue: 'c-lost', void: 'c-archived', held: 'c-approve' };

/** The cuentas and recibos of a brand as a list: number, month, value, status, PDF. The client says «Ya pagué»;
 *  the admin issues, sends, voids and confirms proofs. */
export function CuentasList({ brandId, docs, admin, reload }: { brandId: string; docs: Cuenta[]; admin?: boolean; reload: () => void }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState<Cuenta | null>(null);
  const [voiding, setVoiding] = useState<Cuenta | null>(null);
  const [reason, setReason] = useState('');

  async function run(id: string, f: () => Promise<unknown>) {
    setBusy(id); setMsg(null);
    try { await f(); reload(); } catch (e) { setMsg(t(errKey(e) as never)); } finally { setBusy(null); }
  }
  const send = (d: Cuenta) => run(d.id, async () => {
    const r = await cuentasApi.act(brandId, d.id, 'send');
    if (r.waMe) { setMsg(t('cc.a.waMe')); window.open(r.waMe, '_blank'); } else setMsg(t('cc.a.sent', { via: (r.via ?? []).join(' + ') || '—' }));
  });
  if (!docs.length) return <p className="t-sm t-mute">{t('cc.empty')}</p>;

  return (
    <div className="col g12">
      {msg && <p className="t-sm" role="status">{msg}</p>}
      <div className="table overflow-x-auto">
        <div className="trow head label min-w-[40rem]" style={{ gridTemplateColumns: '7.5rem minmax(0,1fr) 8rem 8rem minmax(9rem,auto)' }}>
          <span>{t('cc.col.number')}</span><span>{t('cc.col.month')}</span><span>{t('cc.col.value')}</span><span>{t('cc.col.status')}</span><span />
        </div>
        {docs.map((d) => {
          const st = d.held && d.status !== 'void' && d.status !== 'scheduled' ? 'held' : d.status;
          const pending = d.payments.find((p) => p.status === 'pending');
          const open = ['issued', 'sent', 'overdue'].includes(d.status);
          return (
            <div key={d.id} className="trow min-w-[40rem]" style={{ gridTemplateColumns: '7.5rem minmax(0,1fr) 8rem 8rem minmax(9rem,auto)', alignItems: 'center' }}>
              <span className="w7">{d.number}</span>
              <span className="col g2" style={{ minWidth: 0 }}>
                <span className="t-sm" style={{ textTransform: 'capitalize' }}>{monthName(d.billingMonth, lang)}</span>
                <span className="t-xs t-mute">{d.type === 'recibo' ? t('cc.recibo') : t('cc.cuenta', { i: d.index, n: d.of })}{admin && d.status === 'scheduled' ? ` · ${t('cc.a.on', { day: d.scheduledDate })}` : ''}</span>
                {d.voidReason && <span className="t-xs t-mute">{d.voidReason}</span>}
              </span>
              <span className="col g2"><span className="t-sm w7">{cop(d.amount)}</span>{d.paid > 0 && d.status !== 'paid' && d.type === 'cuenta_cobro' && <span className="t-xs t-mute">{t('cc.paidPart', { v: cop(d.paid) })}</span>}</span>
              <span className="col g2"><span><span className={`chip ${CHIP[st]}`}>{t(`cc.st.${st}` as never)}</span></span>{pending && <span className="t-xs t-mute">{t('cc.pending')}</span>}</span>
              <span className="row g8 wrap" style={{ justifyContent: 'flex-end' }}>
                {d.hasPdf && <button className="btn btn-ghost btn-sm" onClick={() => openUrl(admin ? cuentasApi.adminPdf(brandId, d.id) : cuentasApi.pdf(brandId, d.id))}>{t('cc.pdf')}</button>}
                {!admin && open && d.type === 'cuenta_cobro' && !pending && <button className="btn btn-secondary btn-sm" onClick={() => setPaying(d)}>{t('cc.iPaid')}</button>}
                {admin && d.status === 'scheduled' && <button className="btn btn-secondary btn-sm" disabled={busy === d.id} onClick={() => run(d.id, () => cuentasApi.act(brandId, d.id, 'issue'))}>{t('cc.a.issue')}</button>}
                {admin && (d.status === 'issued' || (open && d.held)) && <button className="btn btn-primary btn-sm" disabled={busy === d.id} onClick={() => send(d)}>{t('cc.a.send')}</button>}
                {admin && pending && <button className="btn btn-primary btn-sm" disabled={busy === d.id} onClick={() => run(d.id, () => cuentasApi.confirm(brandId, d.id, pending.id))}>{t('cc.a.confirm')}</button>}
                {admin && d.status !== 'void' && d.status !== 'paid' && d.paid === 0 && <button className="btn btn-ghost btn-sm" onClick={() => { setVoiding(d); setReason(''); }}>{t('cc.a.void')}</button>}
              </span>
            </div>
          );
        })}
      </div>
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
