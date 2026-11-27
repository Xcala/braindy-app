import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cuentasApi, errKey, money, monthName, type Cuenta, type Profile, type SendResult } from '../api';
import '../cuentas.css';

type Step = 'confirm' | 'busy' | 'done';

/** «Enviar» a cuenta or recibo: first who it goes to (accounting email, WhatsApp, the people who see Billing in
 *  the app), then sending, then what went out. Sending always puts it in the client's Pagos. */
export function SendDialog({ brandId, doc, profile, people, onClose }: { brandId: string; doc: Cuenta; profile: Profile | null; people: number; onClose: (sent: boolean) => void }) {
  const { t, lang } = useI18n();
  const [step, setStep] = useState<Step>('confirm');
  const [res, setRes] = useState<SendResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const email = profile?.accountingEmail?.trim() || '';
  const wa = profile?.accountingWhatsApp?.trim() || '';

  async function send() {
    setStep('busy'); setErr(null);
    try { setRes(await cuentasApi.act(brandId, doc.id, 'send')); setStep('done'); }
    catch (e) { setErr(t(errKey(e) as never)); setStep('confirm'); }
  }
  const went = (ch: string) => !!res?.via?.includes(ch);
  const rows = [
    { key: 'email', ico: '✉', label: t('cc.s.email'), to: email, ok: went('email'), note: step === 'done' && email && !went('email') ? t('cc.s.failed') : '' },
    { key: 'wa', ico: '☏', label: 'WhatsApp', to: wa, ok: went('whatsapp'), note: step === 'done' && res?.waMe ? t('cc.s.waClosed') : step === 'done' && wa && !went('whatsapp') ? t('cc.s.failed') : '' },
    { key: 'app', ico: '◉', label: t('cc.s.app'), to: people ? ((res?.people ?? people) === 1 ? t('pg.s.people1') : t('cc.s.people', { n: String(res?.people ?? people) })) : t('cc.s.noPeople'), ok: step === 'done', note: '' },
  ];
  const close = () => onClose(step === 'done');

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && step !== 'busy' && close()}>
      <div className="modal w-full max-w-[30rem] col g16" role="dialog" aria-modal="true" aria-labelledby="cc-send-h">
        {step === 'done' ? (
          <div className="col g8" style={{ alignItems: 'center', textAlign: 'center' }}>
            <span className="cc-done" aria-hidden="true"><svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
            <h2 className="h2" id="cc-send-h">{t('cc.s.sent', { n: doc.number })}</h2>
            <p className="t-sm t-mute" role="status">{t('cc.s.sentLead')}</p>
          </div>
        ) : (
          <div className="col g4">
            <h2 className="h2" id="cc-send-h">{t('cc.s.title', { n: doc.number })}</h2>
            <p className="t-sm t-mute">{monthName(doc.billingMonth, lang)} · <b>{money(doc.amount, doc.currency)}</b></p>
          </div>
        )}

        <div className="col" aria-live="polite">
          {rows.map((r) => (
            <div key={r.key} className={`cc-to ${r.ok ? 'is-ok' : ''} ${!r.to ? 'is-off' : ''}`}>
              <span className="cc-to-ico" aria-hidden="true">{r.ok ? '✓' : r.ico}</span>
              <span className="col" style={{ minWidth: 0 }}>
                <span className="t-sm w7">{r.label}</span>
                <span className="t-sm truncate">{r.to || t('cc.s.none')}</span>
                {r.note && <span className="t-xs t-mute">{r.note}</span>}
              </span>
            </div>
          ))}
        </div>

        {step !== 'done' && !email && !wa && <p className="t-sm" role="note">{t('cc.s.onlyApp')}</p>}
        {err && <p className="t-sm" role="alert">{err}</p>}

        <div className="row g12 wrap" style={{ justifyContent: 'flex-end' }}>
          {step === 'done' ? (
            <>
              {res?.waMe && <a className="btn btn-secondary" href={res.waMe} target="_blank" rel="noreferrer">{t('cc.s.openWa')}</a>}
              <button className="btn btn-primary" onClick={close} autoFocus>{t('cc.s.ok')}</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" disabled={step === 'busy'} onClick={close}>{t('common.cancel')}</button>
              <button className="btn btn-primary" disabled={step === 'busy'} onClick={send} autoFocus>
                {step === 'busy' ? <><span className="cc-spin" aria-hidden="true" /> {t('cc.s.sending')}</> : t('cc.a.send')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
