import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { SignaturePad } from '../../contracts/SignaturePad';
import { cuentasApi, errKey, readAsDataUrl, type Issuer, type IssuerId } from '../api';

const EMPTY: Record<IssuerId, Issuer> = {
  nicolas: { name: '', docType: 'CC', docNumber: '', docCity: '', city: 'Bogotá', bank: { bankName: '', accountType: 'Ahorros', accountNumber: '', holder: '' }, legalDeclarations: [], email: '', phone: '', web: '' },
  'nicolas-us': { name: '', docType: 'EIN', docNumber: '', docCity: '', city: '', address: '', bank: { bankName: '', accountType: 'Checking', accountNumber: '', holder: '', routingNumber: '', swift: '', bankAddress: '' }, legalDeclarations: [], email: '', phone: '', web: '' },
};

/** Admin › Billing: who charges. Two profiles of Nicolás: Colombia (COP, cuenta de cobro in Spanish) and USA (USD, invoice in English).
 *  Document, bank, legal lines and signature per profile. With onlyIfMissing it shows only while the Colombian profile has no signature. */
export function IssuerSettings({ onlyIfMissing = false }: { onlyIfMissing?: boolean }) {
  const { t } = useI18n();
  const [id, setId] = useState<IssuerId>('nicolas');
  const [all, setAll] = useState<Record<IssuerId, Issuer>>(EMPTY);
  const [legal, setLegal] = useState<Record<IssuerId, string>>({ nicolas: '', 'nicolas-us': '' });
  const [sig, setSig] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    cuentasApi.issuers().then((r) => {
      const next = { ...EMPTY }; const lg = { nicolas: '', 'nicolas-us': '' };
      for (const x of r.issuers) if (x.issuer) { next[x.id] = { ...EMPTY[x.id], ...x.issuer, bank: { ...EMPTY[x.id].bank, ...x.issuer.bank } }; lg[x.id] = (x.issuer.legalDeclarations ?? []).join('\n'); }
      setAll(next); setLegal(lg);
    }).catch(() => undefined).finally(() => setLoaded(true));
  }, []);
  const i = all[id];
  const us = id === 'nicolas-us';
  const other: IssuerId = us ? 'nicolas' : 'nicolas-us';
  const setI = (v: Issuer) => setAll((a) => ({ ...a, [id]: v }));

  if (onlyIfMissing && (!loaded || (all.nicolas.hasSignature && !msg))) return null;
  const save = () => cuentasApi.saveIssuer({ ...i, legalDeclarations: legal[id].split('\n').map((l) => l.trim()).filter(Boolean) }, id)
    .then((r) => { setI({ ...EMPTY[id], ...r.issuer, bank: { ...EMPTY[id].bank, ...r.issuer.bank }, hasSignature: i.hasSignature }); setMsg(t('cc.a.saved')); }).catch((e) => setMsg(t(errKey(e) as never)));
  const done = () => { setI({ ...i, hasSignature: true }); setSig(null); setMsg(t('cc.a.saved')); };
  const saveSig = (png: string) => cuentasApi.signature(png, id).then(done).catch((e) => setMsg(t(errKey(e) as never)));
  const copySig = () => cuentasApi.copySignature(id, other).then(done).catch((e) => setMsg(t(errKey(e) as never)));
  const f = (key: string, label: string, value: string, on: (v: string) => void) => (
    <div className="field"><label htmlFor={`is-${key}`}>{label}</label><input id={`is-${key}`} className="input" value={value} onChange={(e) => on(e.target.value)} /></div>
  );
  const bank = (k: keyof Issuer['bank']) => (v: string) => setI({ ...i, bank: { ...i.bank, [k]: v } });

  return (
    <details className="card col g12" open={loaded && !all.nicolas.hasSignature ? true : undefined}>
      <summary className="w7">{t('cc.i.title')}{all.nicolas.name ? ` · ${all.nicolas.name}` : ''}</summary>
      <div className="row g8 wrap" role="tablist" style={{ marginTop: '0.75rem' }}>
        {(['nicolas', 'nicolas-us'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={id === k} className={`btn btn-sm ${id === k ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setId(k); setSig(null); setMsg(null); }}>
            {t(k === 'nicolas' ? 'cc.i.co' : 'cc.i.us')}{all[k].hasSignature ? '' : ` · ${t('cc.i.noSigShort')}`}
          </button>
        ))}
      </div>
      <p className="t-xs t-mute">{t(us ? 'cc.i.hintUs' : 'cc.i.hint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {f('name', t('cc.i.name'), i.name, (v) => setI({ ...i, name: v }))}
        <div className="field"><label htmlFor="is-dt">{t('cc.i.docType')}</label>
          <select id="is-dt" className="input" value={i.docType} onChange={(e) => setI({ ...i, docType: e.target.value as Issuer['docType'] })}>
            {us ? <><option value="EIN">EIN</option><option value="ITIN">ITIN</option><option value="SSN">SSN</option></> : <><option value="CC">C.C.</option><option value="NIT">NIT</option></>}
          </select></div>
        {f('dn', t('cc.i.docNumber'), i.docNumber, (v) => setI({ ...i, docNumber: v }))}
        {us ? f('ad', t('cc.i.address'), i.address ?? '', (v) => setI({ ...i, address: v })) : f('dc', t('cc.i.docCity'), i.docCity, (v) => setI({ ...i, docCity: v }))}
        {f('city', t('cc.i.city'), i.city, (v) => setI({ ...i, city: v }))}
        {f('bank', t('cc.i.bank'), i.bank.bankName, bank('bankName'))}
        {f('at', t('cc.i.accType'), i.bank.accountType, bank('accountType'))}
        {f('an', t('cc.i.accNumber'), i.bank.accountNumber, bank('accountNumber'))}
        {us && f('rt', t('cc.i.routing'), i.bank.routingNumber ?? '', bank('routingNumber'))}
        {us && f('sw', t('cc.i.swift'), i.bank.swift ?? '', bank('swift'))}
        {us && f('ba', t('cc.i.bankAddress'), i.bank.bankAddress ?? '', bank('bankAddress'))}
        {f('ho', t('cc.i.holder'), i.bank.holder, bank('holder'))}
        {f('em', t('cc.i.email'), i.email ?? '', (v) => setI({ ...i, email: v }))}
        {f('ph', t('cc.i.phone'), i.phone ?? '', (v) => setI({ ...i, phone: v }))}
        {f('web', t('cc.i.web'), i.web ?? '', (v) => setI({ ...i, web: v }))}
      </div>
      <div className="field"><label htmlFor="is-lg">{t('cc.i.legal')}</label><textarea id="is-lg" className="input" rows={4} value={legal[id]} onChange={(e) => setLegal({ ...legal, [id]: e.target.value })} /></div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary btn-sm" onClick={save}>{t('set.save')}</button></div>

      <div className="col g8">
        <p className="w7">{t('cc.i.signature')} · <span className="t-sm t-mute">{i.hasSignature ? t('cc.i.hasSig') : t('cc.i.noSig')}</span></p>
        {all[other].hasSignature && !i.hasSignature && <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={copySig}>{t(us ? 'cc.i.copyFromCo' : 'cc.i.copyFromUs')}</button>}
        <SignaturePad label={t('cc.i.drawSig')} onChange={setSig} />
        <div className="row between g12 wrap">
          <label className="t-sm">{t('cc.i.uploadSig')} <input type="file" accept="image/png" onChange={async (e) => { const file = e.target.files?.[0]; if (file) saveSig(await readAsDataUrl(file)); }} /></label>
          <button className="btn btn-secondary btn-sm" disabled={!sig} onClick={() => sig && saveSig(sig)}>{t('cc.i.saveSig')}</button>
        </div>
      </div>
      {msg && <p className="t-sm" role="status">{msg}</p>}
    </details>
  );
}
