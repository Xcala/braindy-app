import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cuentasApi, fromMinor, money, toMinor, type Agreement } from '../api';
import '../cuentas.css';

const pct = (n: number, total: number) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0);
/** Until NickMark sets them, the stages split the project total evenly (the last one takes the remainder). */
const evenSplit = (total: number, n: number) => Array.from({ length: n }, (_, i) => (i < n - 1 ? Math.floor(total / n) : total - Math.floor(total / n) * (n - 1)));

/** How far the work of a project is: the value of what is done over what its stages are worth. null without stages. */
export function workOf(a: Agreement) {
  const stages = a.packs ?? [];
  if (!stages.length) return null;
  const value = a.stageValue?.length === stages.length ? a.stageValue : evenSplit(a.totalAmount, stages.length);
  const prog = stages.map((_, i) => a.stageProgress?.[i] ?? 0);
  const worth = value.reduce((s, v) => s + v, 0);
  if (worth <= 0) return null;
  const done = Math.round(value.reduce((s, v, i) => s + (v * prog[i]) / 100, 0));
  return { pct: pct(done, worth), done, worth, complete: prog.filter((v) => v === 100).length, stages: stages.length, others: prog.filter((v) => v < 100) };
}

/** Paid vs work done on one project, one bar under the other. Stages (the project's packs) are not equal: each has
 *  what it is worth, and work done is the value of what is done (each stage on a slider, 0–100 %). */
export function ProjectBars({ brandId, agreement: a, paid, onSaved }: { brandId: string; agreement: Agreement; paid: number; onSaved: () => void }) {
  const { t } = useI18n();
  const cur = a.currency ?? 'COP';
  const stages = a.packs ?? [];
  const initVal = a.stageValue?.length === stages.length ? a.stageValue : evenSplit(a.totalAmount, stages.length);
  const [prog, setProg] = useState<number[]>(stages.map((_, i) => a.stageProgress?.[i] ?? 0));
  const [vals, setVals] = useState<string[]>(initVal.map((v) => fromMinor(v, cur)));
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const value = vals.map((v) => toMinor(v, cur));
  const worth = value.reduce((s, v) => s + v, 0);
  const doneValue = Math.round(value.reduce((s, v, i) => s + (v * (prog[i] ?? 0)) / 100, 0));
  const p = pct(paid, a.totalAmount);
  const w = stages.length && worth > 0 ? pct(doneValue, worth) : null;
  const done = prog.filter((v) => v === 100).length;
  const gap = w === null ? 0 : p - w;
  const verdict = w === null ? null : gap > 10 ? 'cc.pb.payAhead' : gap < -10 ? 'cc.pb.workAhead' : 'cc.pb.even';
  const reset = () => { setProg(stages.map((_, i) => a.stageProgress?.[i] ?? 0)); setVals(initVal.map((v) => fromMinor(v, cur))); setEdit(false); };
  const save = async () => { setBusy(true); try { await cuentasApi.stages(brandId, a.id, prog, value); setEdit(false); onSaved(); } finally { setBusy(false); } };

  return (
    <div className="col g8">
      <div className="cc-pb">
        <span className="t-xs w7">{t('cc.pb.paid')}</span>
        <div className="cc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} aria-label={t('cc.pr.label', { p: String(p) })}><span className="is-paid" style={{ width: `${p}%` }} /></div>
        <span className="t-xs t-mute">{p}% · {money(paid, cur)}</span>
      </div>
      <div className="cc-pb">
        <span className="t-xs w7">{t('cc.pb.work')}</span>
        {w === null ? <span className="t-xs t-mute" style={{ gridColumn: '2 / -1' }}>{t('cc.pb.noData')}</span> : (
          <>
            <div className="cc-bar is-work" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={w} aria-label={t('cc.pb.workLabel', { p: String(w) })}><span className="is-paid" style={{ width: `${w}%` }} /></div>
            <span className="t-xs t-mute">{w}% · {money(doneValue, cur)}</span>
          </>
        )}
      </div>
      <div className="row between g8 wrap">
        {/* «98 % del valor hecho · 1 de 2 etapas completas, la otra en 95 %»: the % and the stages say the same thing. */}
        <p className="t-xs t-mute" style={{ margin: 0 }}>{verdict && <b>{t(verdict as never)}</b>} {w !== null && t('pg.a.workText', { p: String(w), d: String(done), n: String(stages.length) })}{w !== null && stages.length - done === 1 && done > 0 ? t('pg.a.workOther', { p: String(prog.find((v) => v < 100) ?? 0) }) : ''}</p>
        {stages.length > 0 && !edit && <button className="btn btn-ghost btn-sm" onClick={() => setEdit(true)}>{t('cc.pb.mark')}</button>}
      </div>
      {edit && (
        <div className="col g8" style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
          <div className="cc-stage label"><span>{t('cc.pb.stage')}</span><span>{t('cc.pb.value')} ({cur})</span><span>{t('cc.pb.howFar')}</span></div>
          {stages.map((s, i) => (
            <div key={i} className="cc-stage">
              <span className="t-sm" style={{ minWidth: 0 }}><b>{s.name}</b></span>
              <input className="input" inputMode="decimal" aria-label={`${t('cc.pb.value')} · ${s.name}`} value={vals[i]} onChange={(e) => setVals(vals.map((v, j) => (j === i ? e.target.value : v)))} />
              <span className="cc-range">
                <input type="range" min={0} max={100} step={5} aria-label={`${t('cc.pb.howFar')} · ${s.name}`} value={prog[i]}
                  onChange={(e) => setProg(prog.map((v, j) => (j === i ? Number(e.target.value) : v)))} />
                <b className="t-sm">{prog[i] === 100 ? t('cc.pb.s100') : `${prog[i]}%`}</b>
              </span>
            </div>
          ))}
          <p className="t-xs t-mute" style={{ margin: 0 }}>{t('cc.pb.weightHint')}{worth !== a.totalAmount ? ` ${t('cc.pb.sumOff', { sum: money(worth, cur), total: money(a.totalAmount, cur) })}` : ''}</p>
          <div className="row g8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={reset}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-sm" disabled={busy || worth <= 0} onClick={save}>{t('set.save')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
