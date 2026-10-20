import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { publicApi } from '../api';
import { fill, type PublicCopy } from './copy';
import type { OptionKey } from '../types';

/** "Accept and sign" from the design: typed signature, scope consent, then payment (next step). */
export function AcceptDialog({ c, token, prospectName, validLabel, option, onClose }: {
  c: PublicCopy; token: string; prospectName: string; validLabel?: string; option: OptionKey; onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<'form' | 'busy' | 'done' | 'error'>('form');
  const box = useRef<HTMLElement>(null);

  useEffect(() => {
    box.current?.querySelector<HTMLInputElement>('input')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function sign() {
    setState('busy');
    try { await publicApi.accept(token, { name, role, accepted: true, option }); setState('done'); } catch { setState('error'); }
  }

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section ref={box} className="modal w-full max-w-[600px]" role="dialog" aria-modal="true" aria-labelledby="acc-t">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="col g8">
            <span className="t-sm t-mute">{fill(c.acceptFor, { name: prospectName })}{validLabel ? ` · ${fill(c.acceptValid, { date: validLabel })}` : ''}</span>
            <h2 className="h2" id="acc-t">{state === 'done' ? c.done1 : c.accept}</h2>
          </div>
          <button className="btn btn-icon btn-ghost" aria-label={c.close} onClick={onClose}><Icon name="x" /></button>
        </div>
        {state === 'done' ? (
          <div className="col g12">
            <p className="h3">{fill(c.done2, { name: name.split(' ')[0] })}</p>
            <p className="t-mute">{c.doneBody}</p>
            <button className="btn btn-primary self-start" onClick={onClose}>{c.close}</button>
          </div>
        ) : (
          <>
            <div className="row g8 wrap">{c.steps.map((s, i) => <span key={s} className={`chip ${i === 0 ? 'c-prod' : 'chip-plain'}`}>{s}</span>)}</div>
            <p className="t-sm"><span className="t-mute">{c.option}:</span> <b>{c.options[option].name}</b></p>
            <div className="field"><label htmlFor="sn">{c.fullName}</label><input className="input" id="sn" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
            <div className="field"><label htmlFor="sr">{c.roleCompany}</label><input className="input" id="sr" value={role} onChange={(e) => setRole(e.target.value)} autoComplete="organization-title" /></div>
            <div className="col g8">
              <span className="t-sm w7">{c.signature}</span>
              <div aria-live="polite" style={{ height: 96, border: '1.5px dashed var(--line-strong)', borderRadius: 16, display: 'flex', alignItems: 'center', padding: '0 24px', font: "500 34px/1 'Red Hat Display', sans-serif", color: 'var(--ink)' }}>{name}</div>
              <span className="t-xs t-mute">{c.signatureHint}</span>
            </div>
            <label className="row g12" style={{ alignItems: 'flex-start' }}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--azul)', marginTop: 2 }} />
              <span className="t-sm">{c.agree}</span>
            </label>
            {state === 'error' && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{c.error}</p>}
            <button className="btn btn-primary btn-block" style={{ height: 52 }} disabled={!agree || name.trim().length < 3 || state === 'busy'} onClick={sign}>{c.signContinue}</button>
            <span className="t-xs t-mute">{c.paymentNext}</span>
          </>
        )}
      </section>
    </div>
  );
}
