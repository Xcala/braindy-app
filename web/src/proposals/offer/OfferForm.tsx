import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useL } from '../../plan/HostingParts';
import type { Proposal } from '../types';
import { BOS, BOS_KEYS, PHASES, PHASE_KEYS, money, pathOf, projectTotal, type BosKey, type Offer, type PhaseKey } from './catalog';

const EMPTY: Offer = { kind: 'build', phases: { strategy: null, image: null, web: null }, bos: null, bosMonthly: null, bosMonths: 6 };

/** The client's offer: which phases and which BOS plan, each at this client's price. Saves on every change and keeps
 *  the payment amounts in step (project = phases, monthly = BOS), so "Accept and sign" opens the right payment. */
export function OfferForm({ p }: { p: Proposal }) {
  const L = useL();
  const saved = (p.options as Record<string, unknown> | undefined)?.offer as Offer | undefined;
  const [o, setO] = useState<Offer>(saved ?? EMPTY);
  const [flash, setFlash] = useState(false);
  const cur = p.currency ?? 'cop';
  const lang = p.lang ?? 'es';

  async function save(next: Offer, extra: Record<string, unknown> = {}) {
    setO(next);
    const path = pathOf(next);
    const total = projectTotal(next);
    await updateDoc(doc(db, 'proposals', p.id), {
      'options.offer': next, recommended: path,
      [`options.${path}.amount`]: total || null, [`options.${path}.monthly`]: next.bos ? next.bosMonthly ?? null : null, ...extra,
    });
    setFlash(true); setTimeout(() => setFlash(false), 1200);
  }
  const togglePhase = (k: PhaseKey) => {
    const phases = { ...o.phases };
    if (k in phases) delete phases[k]; else phases[k] = null;
    void save({ ...o, phases });
  };
  const num = (v: string) => (v.trim() ? Number(v.replace(/[^\d]/g, '')) : null);

  return (
    <section className="card col g20" aria-labelledby="offer-h">
      <div className="row between"><div className="col g4"><h2 className="h3" id="offer-h">{L(['La propuesta', 'The offer'])}</h2>
        <p className="t-sm t-mute" style={{ margin: 0 }}>{L(['Los servicios son los mismos para todos; el precio es el de este cliente.', 'Services are the same for everyone; the price is this client\'s.'])}</p></div>
        <span className="t-sm" role="status" style={{ color: 'var(--success)', opacity: flash ? 1 : 0 }}>{L(['Guardado', 'Saved'])}</span></div>

      <div className="row g12 wrap">
        <div className="lang" role="group" aria-label={L(['Tipo de proyecto', 'Project type'])}>
          {(['build', 'rebuild'] as const).map((k) => <button key={k} type="button" aria-pressed={o.kind === k} className={o.kind === k ? 'is-on' : ''} onClick={() => save({ ...o, kind: k })}>{k === 'build' ? 'Build' : 'ReBuild'}</button>)}
        </div>
        <div className="lang" role="group" aria-label={L(['Moneda', 'Currency'])}>
          {(['cop', 'usd'] as const).map((k) => <button key={k} type="button" aria-pressed={cur === k} className={cur === k ? 'is-on' : ''} onClick={() => save(o, { currency: k })}>{k.toUpperCase()}</button>)}
        </div>
      </div>

      <div className="col g8"><p className="label">{L(['Proyecto · fases', 'Project · phases'])}</p>
        {PHASE_KEYS.map((k) => (
          <div key={k} className="row g12 wrap" style={{ alignItems: 'center' }}>
            <label className="row g8" style={{ minWidth: '13rem' }}><input type="checkbox" checked={k in o.phases} onChange={() => togglePhase(k)} />
              <span className="w7">{PHASES[k].name}</span></label>
            {k in o.phases && <Money label={PHASES[k].name} value={o.phases[k]} onSave={(v) => save({ ...o, phases: { ...o.phases, [k]: num(v) } })} />}
          </div>
        ))}
        {projectTotal(o) > 0 && <p className="t-sm" style={{ margin: 0 }}>{L(['Total del proyecto: ', 'Project total: '])}<b>{money(projectTotal(o), cur, lang)}</b></p>}
      </div>

      <div className="col g8"><p className="label">{L(['BOS · cada mes', 'BOS · every month'])}</p>
        <div className="row g8 wrap">
          {[null, ...BOS_KEYS].map((k) => <button key={k ?? 'none'} type="button" className={`btn btn-sm ${o.bos === k ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => save({ ...o, bos: k as BosKey | null })}>{k ? BOS[k].name : L(['Sin BOS', 'No BOS'])}</button>)}
        </div>
        {o.bos && (
          <div className="row g12 wrap">
            <Money show label={L(['Precio al mes', 'Price per month'])} value={o.bosMonthly} onSave={(v) => save({ ...o, bosMonthly: num(v) })} />
            <Money label={L(['Meses', 'Months'])} value={o.bosMonths} plain onSave={(v) => save({ ...o, bosMonths: num(v) })} />
          </div>
        )}
      </div>

      <Money label={L(['Nota para el cliente (opcional)', 'Note for the client (optional)'])} text value={o.note} wide onSave={(v) => save({ ...o, note: v.trim() || undefined })} />
    </section>
  );
}

function Money({ label, value, onSave, plain, text, wide, show }: { label: string; value?: number | string | null; onSave: (v: string) => void; plain?: boolean; text?: boolean; wide?: boolean; show?: boolean }) {
  const [v, setV] = useState(value == null ? '' : String(value));
  const id = `o-${label.replace(/\W+/g, '-')}`;
  return (
    <div className="field" style={{ width: wide ? '100%' : plain ? '7rem' : '13rem' }}>
      <label htmlFor={id} className={wide || plain || show ? undefined : 'sr-only'}>{label}</label>
      <input id={id} className="input" inputMode={text ? 'text' : 'numeric'} placeholder={text ? '' : plain ? '6' : '0'} value={v}
        onChange={(e) => setV(e.target.value)} onBlur={() => v !== (value == null ? '' : String(value)) && onSave(v)} />
    </div>
  );
}
