import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { cuentasApi, errKey, openUrl, type Cuenta, type Profile } from './api';
import { SendDialog } from './admin/SendDialog';
import { ConfirmIssue, MarkPaid, pendingWhat } from './admin/ListDialogs';
import { AdminRow, sendable, type RowActions } from './admin/AdminRow';
import { ScheduleOne, SendAll } from './admin/SendPending';
import './cuentas.css';

const todayBogota = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

/** NickMark's list of a brand's cuentas and recibos: a table while it fits, one card per row when it does not (the
 *  Asistente open on a laptop, a phone). Sends everything pending at once (now or on a day), issues early, voids,
 *  confirms proofs and programs a send from the ⋯ menu. The client sees its own view (CuentasClient). */
export function CuentasList({ brandId, docs, reload, sendTo }: { brandId: string; docs: Cuenta[]; reload: () => void; sendTo?: { profile: Profile | null; people: number } }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [voiding, setVoiding] = useState<Cuenta | null>(null);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState<Cuenta | null>(null);
  const [issuing, setIssuing] = useState<Cuenta | null>(null);
  const [sendAll, setSendAll] = useState(false);
  const [marking, setMarking] = useState<Cuenta | null>(null);
  const [later, setLater] = useState<Cuenta | null>(null);

  async function run(id: string, f: () => Promise<unknown>, ok?: string) {
    setBusy(id); setMsg(null);
    try { await f(); if (ok) setMsg(ok); reload(); } catch (e) { setMsg(t(errKey(e) as never)); } finally { setBusy(null); }
  }
  if (!docs.length) return <p className="t-sm t-mute">{t('cc.empty')}</p>;
  const cuentas = docs.filter((d) => d.type === 'cuenta_cobro');
  const recibos = docs.filter((d) => d.type === 'recibo');
  // What is waiting to go out and not already programmed for a day.
  const pendingSend = [...cuentas, ...recibos].filter((d) => sendable(d) && !d.sendAt);
  const issue = (d: Cuenta) => run(d.id, () => cuentasApi.act(brandId, d.id, 'issue'));
  const act: RowActions = {
    pdf: (d) => openUrl(cuentasApi.adminPdf(brandId, d.id)),
    send: setSending,
    issue: (d) => (d.scheduledDate > todayBogota() ? setIssuing(d) : issue(d)),
    confirm: (d, p) => run(d.id, () => cuentasApi.confirm(brandId, d.id, p)),
    proof: (d, p) => openUrl(cuentasApi.proof(brandId, d.id, p)),
    markPaid: setMarking,
    overdue: (d, on) => run(d.id, () => cuentasApi.overdue(brandId, d.id, on)),
    schedule: setLater,
    unschedule: (d) => run(d.id, () => cuentasApi.schedule(brandId, d.id, null), t('pg.r.unscheduled', { n: d.number })),
    void: (d) => { setVoiding(d); setReason(''); },
  };
  const list = (rows: Cuenta[], label: string) => (
    <div className="col g8">
      <p className="label">{label}</p>
      <div className="cc-list" role="table">{rows.map((d) => <AdminRow key={d.id} d={d} busy={busy === d.id} act={act} />)}</div>
    </div>
  );

  return (
    <div className="col g16">
      {msg && <p className="t-sm" role="status">{msg}</p>}
      {pendingSend.length > 0 && (
        <div className="cc-warn row between g12 wrap">
          <span className="t-sm" style={{ minWidth: 0, flex: '1 1 14rem' }}>{t('cc.all.hint', { n: pendingWhat(t as never, pendingSend) })}</span>
          <button className="btn btn-primary btn-sm" onClick={() => setSendAll(true)}>{t('cc.all.btn', { n: String(pendingSend.length) })}</button>
        </div>
      )}
      {cuentas.length > 0 && list(cuentas, t('pg.a.listC', { n: String(cuentas.length) }))}
      {recibos.length > 0 && list(recibos, t('pg.c.recibos', { n: String(recibos.length) }))}
      {sendAll && <SendAll brandId={brandId} docs={pendingSend} profile={sendTo?.profile ?? null} people={sendTo?.people ?? 0} onClose={(sent, m) => { setSendAll(false); if (m) setMsg(m); if (sent) reload(); }} />}
      {later && <ScheduleOne brandId={brandId} doc={later} profile={sendTo?.profile ?? null} onClose={(m) => { setLater(null); if (m) { setMsg(m); reload(); } }} />}
      {marking && <MarkPaid brandId={brandId} doc={marking} onClose={(done) => { setMarking(null); if (done) reload(); }} />}
      {issuing && <ConfirmIssue doc={issuing} onClose={() => setIssuing(null)} onIssue={() => { const d = issuing; setIssuing(null); issue(d); }} />}
      {sending && <SendDialog brandId={brandId} doc={sending} profile={sendTo?.profile ?? null} people={sendTo?.people ?? 0} onClose={(sent) => { setSending(null); if (sent) reload(); }} />}
      {voiding && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setVoiding(null)}>
          <div className="modal w-full max-w-[28rem] col g12" role="dialog" aria-modal="true" aria-labelledby="void-h">
            <h2 className="h2" id="void-h">{t('cc.a.void')} {voiding.number}</h2>
            <div className="field"><label htmlFor="void-r">{t('cc.a.voidQ')}</label><input id="void-r" className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <div className="row g12" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setVoiding(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" disabled={!reason.trim()} onClick={() => { const d = voiding; setVoiding(null); run(d.id, () => cuentasApi.act(brandId, d.id, 'void', reason)); }}>{t('cc.a.voidOk')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
