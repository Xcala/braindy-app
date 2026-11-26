import { useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cuentasApi, dueOf, errKey, shortDate, type Cuenta, type Profile } from '../api';
import '../cuentas.css';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const tomorrow = () => { const d = new Date(`${today()}T12:00:00`); d.setDate(d.getDate() + 1); return d.toLocaleDateString('en-CA'); };
/** The day a programmed send defaults to: the cuenta's own due day if it is still ahead, else tomorrow. */
const defaultDay = (docs: Cuenta[]) => docs.map((d) => (d.type === 'cuenta_cobro' ? dueOf(d) : '')).filter((x) => x > today()).sort()[0] ?? tomorrow();
/** «BM-06-01 a 03» when the numbers run in a row, else the list. */
const range = (docs: Cuenta[], to: string) => {
  const n = docs.map((d) => d.number);
  if (n.length < 3) return n.join(', ');
  const tail = n[n.length - 1].split('-').pop();
  return `${n[0]} ${to} ${tail}`;
};

function Modal({ id, onClose, children }: { id: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="modal w-full max-w-[30rem] col g16" role="dialog" aria-modal="true" aria-labelledby={id}>{children}</div>
    </div>
  );
}

/** Who gets them, said once: accounting email/WhatsApp and the people with Billing in the app (singular and plural). */
function useTo(profile: Profile | null, people: number) {
  const { t } = useI18n();
  const to = [profile?.accountingEmail, profile?.accountingWhatsApp].filter(Boolean).join(' · ');
  const app = people === 1 ? t('pg.s.app1') : t('cc.all.app', { n: String(people) });
  return { to, line: `${to ? t('cc.all.to', { to }) : t('cc.all.noTo')} ${app}` };
}

/** «Enviar pendientes»: grouped by what they mean (already paid, receipts, to pay), sent now or programmed for a day. */
export function SendAll({ brandId, docs, profile, people, onClose }: { brandId: string; docs: Cuenta[]; profile: Profile | null; people: number; onClose: (sent: boolean, msg?: string) => void }) {
  const { t, lang } = useI18n();
  const [step, setStep] = useState<'ask' | 'sending' | 'done'>('ask');
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [day, setDay] = useState(defaultDay(docs));
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const { to, line } = useTo(profile, people);
  const groups = [
    { key: 'paid', label: 'pg.s.gPaid', list: docs.filter((d) => d.type === 'cuenta_cobro' && d.status === 'paid') },
    { key: 'rec', label: 'pg.s.gRec', list: docs.filter((d) => d.type === 'recibo') },
    { key: 'open', label: 'pg.s.gOpen', list: docs.filter((d) => d.type === 'cuenta_cobro' && d.status !== 'paid') },
  ].filter((g) => g.list.length);

  async function go() {
    setStep('sending');
    const bad: string[] = [];
    for (const [i, d] of docs.entries()) {
      try { await (when === 'now' ? cuentasApi.act(brandId, d.id, 'send') : cuentasApi.schedule(brandId, d.id, day)); } catch { bad.push(d.number); }
      setDone(i + 1);
    }
    setFailed(bad); setStep('done');
  }
  const ok = docs.length - failed.length;
  const result = when === 'now' ? t('cc.all.done', { n: String(ok) }) : t('pg.s.scheduled', { n: String(ok), d: shortDate(day, lang) });

  return (
    <Modal id="cc-all-h" onClose={() => step !== 'sending' && onClose(step === 'done', step === 'done' ? result : undefined)}>
      <h2 className="h2" id="cc-all-h">{t('pg.s.title')}</h2>
      <div className="col cc-groups">
        {groups.map((g) => (
          <div key={g.key} className="cc-group"><span className="t-sm w7">{t(g.label as never, { n: String(g.list.length) })}</span><span className="t-sm t-mute">{range(g.list, lang === 'es' ? 'a' : 'to')}</span></div>
        ))}
      </div>
      {step === 'ask' && (
        <div className="col g8">
          <div className="cc-seg" role="radiogroup" aria-label={t('cc.a.send')}>
            {(['now', 'later'] as const).map((w) => (
              <button key={w} type="button" role="radio" aria-checked={when === w} className={when === w ? 'is-on' : ''} onClick={() => setWhen(w)}>{t(w === 'now' ? 'pg.s.now' : 'pg.s.later')}</button>
            ))}
          </div>
          {when === 'later' && <div className="field"><label htmlFor="cc-all-day">{t('pg.s.date')}</label><input id="cc-all-day" className="input" type="date" min={today()} value={day} onChange={(e) => setDay(e.target.value)} /></div>}
          <p className="t-sm t-mute">{when === 'later' ? (to ? t('pg.s.laterHint', { to }) : t('pg.s.laterHintApp')) : line}</p>
        </div>
      )}
      {step === 'sending' && (
        <div className="col g8" role="status">
          <p className="t-sm"><span className="cc-spin" aria-hidden="true" /> {t('cc.all.sending', { i: String(done), n: String(docs.length) })}</p>
          <div className="cc-bar"><span className="is-paid" style={{ width: `${Math.round((done / docs.length) * 100)}%` }} /></div>
        </div>
      )}
      {step === 'done' && (
        <div className="row g12" role="status" style={{ alignItems: 'center' }}>
          <span className="cc-done" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span className="t-sm"><b>{result}</b>{failed.length > 0 ? ` ${t('cc.all.failed', { list: failed.join(', ') })}` : ''}</span>
        </div>
      )}
      <div className="row g12" style={{ justifyContent: 'flex-end' }}>
        {step === 'ask' && <><button className="btn btn-secondary" onClick={() => onClose(false)}>{t('common.cancel')}</button>
          <button className="btn btn-primary" autoFocus disabled={when === 'later' && !(day >= today())} onClick={go}>{t(when === 'now' ? 'cc.all.ok' : 'pg.s.laterOk', { n: String(docs.length) })}</button></>}
        {step === 'done' && <button className="btn btn-primary" autoFocus onClick={() => onClose(true)}>{t('cc.all.close')}</button>}
      </div>
    </Modal>
  );
}

/** «Programar envío…» on one row: the day it goes out by itself. */
export function ScheduleOne({ brandId, doc, profile, onClose }: { brandId: string; doc: Cuenta; profile: Profile | null; onClose: (msg?: string) => void }) {
  const { t, lang } = useI18n();
  const [day, setDay] = useState(doc.sendAt ?? defaultDay([doc]));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { to } = useTo(profile, 0);
  async function go() {
    setBusy(true); setErr(null);
    try { await cuentasApi.schedule(brandId, doc.id, day); onClose(t('pg.s.scheduled', { n: doc.number, d: shortDate(day, lang) })); }
    catch (e) { setErr(t(errKey(e) as never)); setBusy(false); }
  }
  return (
    <Modal id="cc-later-h" onClose={() => !busy && onClose()}>
      <h2 className="h2" id="cc-later-h">{t('pg.s.one', { n: doc.number })}</h2>
      <div className="field"><label htmlFor="cc-later-day">{t('pg.s.date')}</label><input id="cc-later-day" className="input" type="date" min={today()} value={day} onChange={(e) => setDay(e.target.value)} /></div>
      <p className="t-sm t-mute">{to ? t('pg.s.laterHint', { to }) : t('pg.s.laterHintApp')}</p>
      {err && <p className="t-sm" role="alert">{err}</p>}
      <div className="row g12" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" disabled={busy} onClick={() => onClose()}>{t('common.cancel')}</button>
        <button className="btn btn-primary" autoFocus disabled={busy || !(day >= today())} onClick={go}>{t('pg.s.oneOk')}</button>
      </div>
    </Modal>
  );
}
