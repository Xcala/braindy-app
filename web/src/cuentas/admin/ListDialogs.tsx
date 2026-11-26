import { useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cuentasApi, money, type Cuenta, type Profile } from '../api';
import '../cuentas.css';

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
        <h2 className="h2" id="cc-all-h">{t('cc.all.title', { n: String(docs.length) })}</h2>
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
