import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cop, cuentasApi, errKey, monthName, readAsDataUrl, type Agreement, type AgreementInput, type Extracted, type PlanRow } from '../api';

const thisMonth = () => new Date().toLocaleDateString('en-CA').slice(0, 7);
export const EMPTY: AgreementInput = {
  title: '', concept: '', packs: [], servicePeriod: { from: '', to: '' }, executionPlace: 'Bogotá', projectClose: '',
  totalAmount: 0, installments: 1, startMonth: thisMonth(), issueDay: 5, numberingPrefix: '', distributionNote: '', autoSend: false,
};
const packsText = (p: AgreementInput['packs']) => p.map((x) => `${x.name}: ${x.description}`).join('\n');
const packsOf = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(':'); return i > 0 ? { name: l.slice(0, i).trim(), description: l.slice(i + 1).trim() } : { name: l, description: '' }; });

/** What the imported PDF says, turned into the agreement fields (NickMark checks every one before saving). */
function fromExtracted(x: Extracted, sourceSamplePath: string): AgreementInput {
  const prefix = (x.numbers[0] ?? x.numberingPattern ?? '').replace(/-?\d+$/, '').replace(/X+$/i, '').replace(/-$/, '');
  return {
    ...EMPTY, title: x.concept.split(/[.,:]/)[0].slice(0, 80), concept: x.concept, packs: x.packs,
    servicePeriod: { from: x.servicePeriodFrom, to: x.servicePeriodTo }, executionPlace: x.executionPlace || 'Bogotá', projectClose: x.projectClose,
    totalAmount: x.totalAmount, installments: x.installments || x.amountsPerPage.length || 1, startMonth: x.servicePeriodFrom || thisMonth(),
    issueDay: Number(x.issueDates[0]?.slice(8, 10)) || 5, numberingPrefix: prefix, sourceSamplePath,
  };
}

/** New (or draft) project charged in cuentas: import from a PDF, fill, preview the cuentas, save or activate. */
export function AgreementForm({ brandId, initial, onDone }: { brandId: string; initial?: Agreement; onDone: (msg?: string) => void }) {
  const { t, lang } = useI18n();
  const [a, setA] = useState<AgreementInput>(initial ?? EMPTY);
  const [packs, setPacks] = useState(packsText(initial?.packs ?? []));
  const [read, setRead] = useState<Extracted | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [prev, setPrev] = useState<{ rows: PlanRow[]; sum: number; matches: boolean } | null>(null);
  const [ask, setAsk] = useState(false);
  const full = { ...a, packs: packsOf(packs) };
  const set = <K extends keyof AgreementInput>(k: K, v: AgreementInput[K]) => setA((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    const h = setTimeout(() => cuentasApi.preview(brandId, full).then((p) => setPrev(p.problems.length ? null : p)).catch(() => setPrev(null)), 350);
    return () => clearTimeout(h);
  }, [brandId, JSON.stringify(full)]); // eslint-disable-line react-hooks/exhaustive-deps

  async function importPdf(f: File) {
    setBusy('import'); setErr(null);
    try { const r = await cuentasApi.importPdf(brandId, await readAsDataUrl(f)); setRead(r.extracted); const x = fromExtracted(r.extracted, r.sourceSamplePath); setA(x); setPacks(packsText(x.packs)); }
    catch (e) { setErr(t(errKey(e) as never)); } finally { setBusy(null); }
  }
  async function save(andActivate: boolean) {
    setBusy(andActivate ? 'act' : 'save'); setErr(null);
    try {
      let id = initial?.id;
      if (id) await cuentasApi.update(brandId, id, full); else id = (await cuentasApi.create(brandId, full)).id;
      if (!andActivate) return onDone(t('cc.a.saved'));
      const r = await cuentasApi.activate(brandId, id);
      onDone(t('cc.a.activated', { a: r.issued.length, b: r.scheduled.length }));
    } catch (e) { setErr(t(errKey(e) as never)); } finally { setBusy(null); setAsk(false); }
  }
  const field = (id: string, label: string, el: React.ReactNode) => <div className="field"><label htmlFor={id}>{label}</label>{el}</div>;

  return (
    <div className="card col g16">
      <div className="col g8">
        <label className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
          {busy === 'import' ? t('cc.a.importing') : t('cc.a.import')}
          <input type="file" accept="application/pdf" hidden onChange={(e) => e.target.files?.[0] && importPdf(e.target.files[0])} />
        </label>
        <p className="t-xs t-mute">{t('cc.a.importHint')}</p>
      </div>
      <div className={read ? 'grid gap-6 lg:grid-cols-2' : 'col'}>
        {read && (
          <div className="col g8" style={{ minWidth: 0 }}>
            <p className="label">{t('cc.a.read')}</p>
            <dl className="t-sm col g4">
              <div><b>{read.client.legalName}</b> · NIT {read.client.taxId}</div>
              <div>{read.issuer.name} · {read.issuer.docType} {read.issuer.docNumber}</div>
              <div>{read.issuer.bank.bankName} · {read.issuer.bank.accountType} · {read.issuer.bank.accountNumber}</div>
              <div>{read.servicePeriod} · {read.executionPlace}</div>
              <div>{cop(read.totalAmount)} · {read.installments} × [{read.amountsPerPage.map(cop).join(', ')}]</div>
              <div>{read.numbers.join(', ')} · {read.issueDates.join(', ')}</div>
              <div>{read.paymentModality}</div>
            </dl>
            <p className="label">{t('cc.a.warnings')}</p>
            {read.warnings.length ? <ul className="t-sm col g4" style={{ paddingLeft: '1rem', listStyle: 'disc' }}>{read.warnings.map((w) => <li key={w}>{w}</li>)}</ul> : <p className="t-sm">{t('cc.a.noWarnings')}</p>}
          </div>
        )}
        <div className="col g12" style={{ minWidth: 0 }}>
          {field('ag-t', t('cc.a.f.title'), <input id="ag-t" className="input" value={a.title} onChange={(e) => set('title', e.target.value)} />)}
          {field('ag-c', t('cc.a.f.concept'), <textarea id="ag-c" className="input" rows={3} value={a.concept} onChange={(e) => set('concept', e.target.value)} />)}
          {field('ag-p', t('cc.a.f.packs'), <textarea id="ag-p" className="input" rows={3} value={packs} onChange={(e) => setPacks(e.target.value)} />)}
          <div className="grid grid-cols-2 gap-3">
            {field('ag-f', t('cc.a.f.from'), <input id="ag-f" className="input" type="month" value={a.servicePeriod.from} onChange={(e) => set('servicePeriod', { ...a.servicePeriod, from: e.target.value })} />)}
            {field('ag-to', t('cc.a.f.to'), <input id="ag-to" className="input" type="month" value={a.servicePeriod.to} onChange={(e) => set('servicePeriod', { ...a.servicePeriod, to: e.target.value })} />)}
            {field('ag-pl', t('cc.a.f.place'), <input id="ag-pl" className="input" value={a.executionPlace} onChange={(e) => set('executionPlace', e.target.value)} />)}
            {field('ag-tot', t('cc.a.f.total'), <input id="ag-tot" className="input" inputMode="numeric" value={a.totalAmount || ''} onChange={(e) => set('totalAmount', Number(e.target.value.replace(/\D/g, '')) || 0)} />)}
            {field('ag-n', t('cc.a.f.n'), <input id="ag-n" className="input" type="number" min={1} max={60} value={a.installments} onChange={(e) => set('installments', Number(e.target.value) || 1)} />)}
            {field('ag-s', t('cc.a.f.start'), <input id="ag-s" className="input" type="month" value={a.startMonth} onChange={(e) => set('startMonth', e.target.value)} />)}
            {field('ag-d', t('cc.a.f.day'), <input id="ag-d" className="input" type="number" min={1} max={28} value={a.issueDay} onChange={(e) => set('issueDay', Number(e.target.value) || 1)} />)}
            {field('ag-x', t('cc.a.f.prefix'), <input id="ag-x" className="input" value={a.numberingPrefix} onChange={(e) => set('numberingPrefix', e.target.value.toUpperCase())} />)}
          </div>
          {field('ag-cl', t('cc.a.f.close'), <input id="ag-cl" className="input" value={a.projectClose} onChange={(e) => set('projectClose', e.target.value)} />)}
          {field('ag-no', t('cc.a.f.note'), <input id="ag-no" className="input" value={a.distributionNote} onChange={(e) => set('distributionNote', e.target.value)} />)}
          <label className="row g8 t-sm"><input type="checkbox" checked={a.autoSend} onChange={(e) => set('autoSend', e.target.checked)} />{t('cc.a.f.auto')}</label>
        </div>
      </div>
      {prev && (
        <div className="col g8">
          <p className="label">{t('cc.a.preview')}</p>
          <ul className="col g4 t-sm">
            {prev.rows.map((r) => <li key={r.number} className="row g12 wrap"><b style={{ minWidth: '6.5rem' }}>{r.number}</b><span style={{ textTransform: 'capitalize', minWidth: '10rem' }}>{monthName(r.billingMonth, lang)}</span><span style={{ minWidth: '7rem' }}>{cop(r.amount)}</span><span className="t-mute">{r.issueNow ? t('cc.a.now') : t('cc.a.on', { day: r.scheduledDate })}</span></li>)}
          </ul>
          <p className="t-sm w7" style={{ color: prev.matches ? undefined : 'var(--danger, #B42318)' }}>{t(prev.matches ? 'cc.a.sum' : 'cc.a.sumBad', { v: cop(prev.sum) })}</p>
        </div>
      )}
      {err && <p className="t-sm" role="alert">{err}</p>}
      {ask && <p className="t-sm w7" role="alert">{t('cc.a.activateQ')}</p>}
      <div className="row g12 wrap" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={() => onDone()}>{t('common.cancel')}</button>
        <button className="btn btn-secondary" disabled={!!busy} onClick={() => save(false)}>{t('cc.a.saveDraft')}</button>
        <button className="btn btn-primary" disabled={!!busy || !prev?.matches} onClick={() => (ask ? save(true) : setAsk(true))}>{t('cc.a.activate')}</button>
      </div>
    </div>
  );
}
