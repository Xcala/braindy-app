import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { SignaturePad } from '../../contracts/SignaturePad';
import { cuentasApi, errKey, readAsDataUrl, type Issuer } from '../api';

const EMPTY: Issuer = { name: '', docType: 'CC', docNumber: '', docCity: '', city: 'Bogotá', bank: { bankName: '', accountType: 'Ahorros', accountNumber: '', holder: '' }, legalDeclarations: [], email: '', phone: '', web: '' };

/** Admin › Billing: who charges on every cuenta de cobro (document, bank, legal lines, signature). */
export function IssuerSettings({ onlyIfMissing = false }: { onlyIfMissing?: boolean }) {
  const { t } = useI18n();
  const [i, setI] = useState<Issuer>(EMPTY);
  const [legal, setLegal] = useState('');
  const [sig, setSig] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { cuentasApi.issuer().then((r) => { if (r.issuer) { setI({ ...EMPTY, ...r.issuer }); setLegal((r.issuer.legalDeclarations ?? []).join('\n')); } }).catch(() => undefined).finally(() => setLoaded(true)); }, []);

  const save = () => cuentasApi.saveIssuer({ ...i, legalDeclarations: legal.split('\n').map((l) => l.trim()).filter(Boolean) })
    .then((r) => { setI({ ...EMPTY, ...r.issuer, hasSignature: i.hasSignature }); setMsg(t('cc.a.saved')); }).catch((e) => setMsg(t(errKey(e) as never)));
  const saveSig = (png: string) => cuentasApi.signature(png).then(() => { setI({ ...i, hasSignature: true }); setSig(null); setMsg(t('cc.a.saved')); }).catch((e) => setMsg(t(errKey(e) as never)));
  const f = (id: string, label: string, value: string, on: (v: string) => void) => (
    <div className="field"><label htmlFor={`is-${id}`}>{label}</label><input id={`is-${id}`} className="input" value={value} onChange={(e) => on(e.target.value)} /></div>
  );
  const bank = (k: keyof Issuer['bank']) => (v: string) => setI({ ...i, bank: { ...i.bank, [k]: v } });

  if (onlyIfMissing && (!loaded || (i.hasSignature && !msg))) return null;
  return (
    <details className="card col g12" open={loaded && !i.hasSignature ? true : undefined}>
      <summary className="w7">{t('cc.i.title')}{i.name ? ` · ${i.name}` : ''}</summary>
      <p className="t-xs t-mute" style={{ marginTop: '0.5rem' }}>{t('cc.i.hint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {f('name', t('cc.i.name'), i.name, (v) => setI({ ...i, name: v }))}
        <div className="field"><label htmlFor="is-dt">{t('cc.i.docType')}</label>
          <select id="is-dt" className="input" value={i.docType} onChange={(e) => setI({ ...i, docType: e.target.value as Issuer['docType'] })}><option value="CC">C.C.</option><option value="NIT">NIT</option></select></div>
        {f('dn', t('cc.i.docNumber'), i.docNumber, (v) => setI({ ...i, docNumber: v }))}
        {f('dc', t('cc.i.docCity'), i.docCity, (v) => setI({ ...i, docCity: v }))}
        {f('city', t('cc.i.city'), i.city, (v) => setI({ ...i, city: v }))}
        {f('bank', t('cc.i.bank'), i.bank.bankName, bank('bankName'))}
        {f('at', t('cc.i.accType'), i.bank.accountType, bank('accountType'))}
        {f('an', t('cc.i.accNumber'), i.bank.accountNumber, bank('accountNumber'))}
        {f('ho', t('cc.i.holder'), i.bank.holder, bank('holder'))}
        {f('em', t('cc.i.email'), i.email ?? '', (v) => setI({ ...i, email: v }))}
        {f('ph', t('cc.i.phone'), i.phone ?? '', (v) => setI({ ...i, phone: v }))}
        {f('web', t('cc.i.web'), i.web ?? '', (v) => setI({ ...i, web: v }))}
      </div>
      <div className="field"><label htmlFor="is-lg">{t('cc.i.legal')}</label><textarea id="is-lg" className="input" rows={4} value={legal} onChange={(e) => setLegal(e.target.value)} /></div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary btn-sm" onClick={save}>{t('set.save')}</button></div>

      <div className="col g8">
        <p className="w7">{t('cc.i.signature')} · <span className="t-sm t-mute">{i.hasSignature ? t('cc.i.hasSig') : t('cc.i.noSig')}</span></p>
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
