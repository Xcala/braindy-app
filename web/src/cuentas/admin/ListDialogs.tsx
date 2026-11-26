import { useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cuentasApi, errKey, money, type Cuenta, type Profile } from '../api';
import '../cuentas.css';

/** «6 cuentas de cobro y 1 recibo»: what is waiting to go out, said by kind so it matches the lists. */
export function pendingWhat(t: (k: never, v?: Record<string, string>) => string, docs: Cuenta[]) {
  const c = docs.filter((d) => d.type === 'cuenta_cobro').length, r = docs.length - c;
  const part = (n: number, one: string, many: string) => (n === 1 ? t(one as never) : t(many as never, { n: String(n) }));
  const parts = [c ? part(c, 'cc.all.c1', 'cc.all.cN') : '', r ? part(r, 'cc.all.r1', 'cc.all.rN') : ''].filter(Boolean);
  return parts.length === 2 ? t('cc.all.and' as never, { a: parts[0], b: parts[1] }) : parts[0] ?? '';
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const longDate = (ymd: string, lang: 'en' | 'es') => new Date(`${ymd}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

function Modal({ id, onClose, children }: { id: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="modal w-full max-w-[28rem] col g16" role="dialog" aria-modal="true" aria-labelledby={id}>{children}</div>
    </div>
  );
}

/** «Emitir ya» on a cuenta planned for a later day: it comes out dated today, not on its planned day. */
export function ConfirmIssue({ doc, onClose, onIssue }: { doc: Cuenta; onClose: () => void; onIssue: () => void }) {
  const { t, lang } = useI18n();
  return (
    <Modal id="cc-issue-h" onClose={onClose}>
      <div className="col g8">
        <h2 className="h2" id="cc-issue-h">{t('cc.iss.title', { n: doc.number })}</h2>
        <p className="t-sm">{t('cc.iss.body', { today: longDate(today(), lang), day: longDate(doc.scheduledDate, lang), v: money(doc.amount, doc.currency) })}</p>
        <p className="t-xs t-mute">{t('cc.iss.note')}</p>
      </div>
      <div className="row g12" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button className="btn btn-primary" autoFocus onClick={onIssue}>{t('cc.iss.ok')}</button>
      </div>
    </Modal>
  );
}

/** Sends every cuenta and recibo still waiting to go out, one after the other, with who gets them and the progress. */
export function SendAll({ brandId, docs, profile, people, onClose }: { brandId: string; docs: Cuenta[]; profile: Profile | null; people: number; onClose: (sent: boolean) => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<'ask' | 'sending' | 'done'>('ask');
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const to = [profile?.accountingEmail, profile?.accountingWhatsApp].filter(Boolean).join(' · ');

  async function go() {
    setStep('sending');
    const bad: string[] = [];
    for (const [i, d] of docs.entries()) {
      try { await cuentasApi.act(brandId, d.id, 'send'); } catch { bad.push(d.number); }
      setDone(i + 1);
    }
    setFailed(bad); setStep('done');
  }

  return (
    <Modal id="cc-all-h" onClose={() => step !== 'sending' && onClose(step === 'done')}>
      <div className="col g8">
        <h2 className="h2" id="cc-all-h">{t('cc.all.title', { n: pendingWhat(t as never, docs) })}</h2>
        <p className="t-sm">{docs.map((d) => d.number).join(', ')}</p>
        <p className="t-sm t-mute">{to ? t('cc.all.to', { to }) : t('cc.all.noTo')} {t('cc.all.app', { n: String(people) })}</p>
      </div>
      {step === 'sending' && (
        <div className="col g8" role="status">
          <p className="t-sm"><span className="cc-spin" aria-hidden="true" /> {t('cc.all.sending', { i: String(done), n: String(docs.length) })}</p>
          <div className="cc-bar"><span className="is-paid" style={{ width: `${Math.round((done / docs.length) * 100)}%` }} /></div>
        </div>
      )}
      {step === 'done' && (
        <div className="row g12" role="status" style={{ alignItems: 'center' }}>
          <span className="cc-done" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span className="t-sm"><b>{t('cc.all.done', { n: String(docs.length - failed.length) })}</b>{failed.length > 0 ? ` ${t('cc.all.failed', { list: failed.join(', ') })}` : ''}</span>
        </div>
      )}
      <div className="row g12" style={{ justifyContent: 'flex-end' }}>
        {step === 'ask' && <><button className="btn btn-secondary" onClick={() => onClose(false)}>{t('common.cancel')}</button><button className="btn btn-primary" autoFocus onClick={go}>{t('cc.all.ok', { n: String(docs.length) })}</button></>}
        {step === 'done' && <button className="btn btn-primary" autoFocus onClick={() => onClose(true)}>{t('cc.all.close')}</button>}
      </div>
    </Modal>
  );
}

/** «Pagada» on one cuenta: records what is still owed on it (date, method) and, if chosen, issues the recibo. */
export function MarkPaid({ brandId, doc, onClose }: { brandId: string; doc: Cuenta; onClose: (done: boolean) => void }) {
  const { t } = useI18n();
  const cur = doc.currency ?? 'COP';
  const owed = doc.amount - doc.paid;
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState(cur === 'USD' ? 'Transfer' : 'Transferencia');
  const [receipt, setReceipt] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go() {
    setBusy(true); setErr(null);
    try { await cuentasApi.pay(brandId, { docIds: [doc.id], amount: owed, date, method, receipt }); onClose(true); }
    catch (e) { setErr(t(errKey(e) as never)); setBusy(false); }
  }
  return (
    <Modal id="cc-mp-h" onClose={() => !busy && onClose(false)}>
      <div className="col g8">
        <h2 className="h2" id="cc-mp-h">{t('cc.mp.title', { n: doc.number })}</h2>
        <p className="t-sm">{t('cc.mp.body', { v: money(owed, cur) })}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="field"><label htmlFor="mp-d">{t('cc.a.pay.date')}</label><input id="mp-d" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field"><label htmlFor="mp-m">{t('cc.a.pay.method')}</label><input id="mp-m" className="input" value={method} onChange={(e) => setMethod(e.target.value)} /></div>
      </div>
      <label className="row g8 t-sm"><input type="checkbox" checked={receipt} onChange={(e) => setReceipt(e.target.checked)} />{t('cc.a.pay.receipt')}</label>
      {err && <p className="t-sm" role="alert">{err}</p>}
      <div className="row g12" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" disabled={busy} onClick={() => onClose(false)}>{t('common.cancel')}</button>
        <button className="btn btn-primary" autoFocus disabled={busy || !method.trim()} onClick={go}>{busy && <span className="cc-spin" aria-hidden="true" />} {t('cc.mp.ok')}</button>
      </div>
    </Modal>
  );
}
