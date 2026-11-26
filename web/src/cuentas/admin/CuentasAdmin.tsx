import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { CuentasList } from '../CuentasList';
import { cop, cuentasApi, errKey, type Agreement, type Cuenta, type Profile } from '../api';
import { AgreementForm } from './AgreementForm';
import { IssuerSettings } from './IssuerSettings';

const EMPTY_PROFILE: Profile = { legalName: '', taxId: '', address: '', city: '', accountingEmail: '', accountingWhatsApp: '' };

/** NickMark's side of a brand's cuentas de cobro: the client's billing data, the projects charged in cuentas
 *  (import, preview, activate), every cuenta and recibo, and recording payments. */
export function CuentasAdmin({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const [data, setData] = useState<{ profile: Profile | null; agreements: Agreement[]; docs: Cuenta[] } | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [form, setForm] = useState<Agreement | 'new' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [nitBad, setNitBad] = useState(false);
  const [pay, setPay] = useState({ agreementId: '', amount: '', date: new Date().toLocaleDateString('en-CA'), method: 'Transferencia', receipt: true });
  const load = useCallback(() => cuentasApi.all(brandId).then((d) => { setData(d); setProfile({ ...EMPTY_PROFILE, ...(d.profile ?? {}) }); }).catch(() => setData({ profile: null, agreements: [], docs: [] })), [brandId]);
  useEffect(() => { load(); }, [load]);
  if (!data) return null;

  const saveProfile = () => cuentasApi.saveProfile(brandId, profile).then((r) => { setNitBad(r.nitOk === false); setMsg(t('cc.a.saved')); }).catch((e) => setMsg(t(errKey(e) as never)));
  const active = data.agreements.filter((a) => a.status === 'active');
  async function record() {
    setMsg(null);
    try {
      const r = await cuentasApi.pay(brandId, { agreementId: pay.agreementId || active[0]?.id, amount: Number(pay.amount.replace(/\D/g, '')), date: pay.date, method: pay.method, receipt: pay.receipt });
      setMsg(t('cc.a.pay.done', { r: r.receipt ? ` · ${r.receipt.number}` : '' })); setPay({ ...pay, amount: '' }); load();
    } catch (e) { setMsg(t(errKey(e) as never)); }
  }
  const input = (id: keyof Profile, label: string) => (
    <div className="field"><label htmlFor={`bp-${id}`}>{label}</label><input id={`bp-${id}`} className="input" value={profile[id] ?? ''} onChange={(e) => setProfile({ ...profile, [id]: e.target.value })} /></div>
  );

  return (
    <section className="col g16" aria-labelledby="cc-admin-h">
      <div className="col g4"><p className="label">{t('cc.a.only')}</p><h2 className="h2" id="cc-admin-h">{t('cc.a.title')}</h2></div>
      {msg && <p className="t-sm" role="status">{msg}</p>}
      <IssuerSettings onlyIfMissing />

      <details className="card col g12" open={!data.profile}>
        <summary className="w7">{t('cc.a.profile')}{data.profile ? ` · ${data.profile.legalName}` : ''}</summary>
        <div className="grid gap-3 sm:grid-cols-2" style={{ marginTop: '0.75rem' }}>
          {input('legalName', t('cc.a.legalName'))}{input('taxId', t('cc.a.taxId'))}{input('address', t('cc.a.address'))}{input('city', t('cc.a.city'))}
          {input('accountingEmail', t('cc.a.email'))}{input('accountingWhatsApp', t('cc.a.wa'))}
        </div>
        {nitBad && <p className="t-sm" role="alert">{t('cc.a.nitBad')}</p>}
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-secondary btn-sm" onClick={saveProfile}>{t('set.save')}</button></div>
      </details>

      <div className="col g8">
        <div className="row between g12 wrap">
          <p className="label">{t('cc.a.agreements')}</p>
          {!form && <button className="btn btn-primary btn-sm" onClick={() => setForm('new')}>{t('cc.a.new')}</button>}
        </div>
        {data.agreements.map((a) => (
          <div key={a.id} className="card card-tight row between g12 wrap">
            <span className="t-sm"><b>{a.title}</b> · {cop(a.totalAmount)} · {a.installments} · {a.numberingPrefix}</span>
            <span className="row g8"><span className="chip">{t(`cc.a.${a.status}` as never)}</span>{a.status === 'draft' && <button className="btn btn-ghost btn-sm" onClick={() => setForm(a)}>{t('bill.edit')}</button>}</span>
          </div>
        ))}
        {form && <AgreementForm brandId={brandId} initial={form === 'new' ? undefined : form} onDone={(m) => { setForm(null); if (m) setMsg(m); load(); }} />}
      </div>

      <CuentasList brandId={brandId} docs={data.docs} admin reload={load} />

      {active.length > 0 && (
        <div className="card col g12">
          <p className="w7">{t('cc.a.payment')}</p>
          <div className="grid gap-3 sm:grid-cols-4">
            {active.length > 1 && <div className="field"><label htmlFor="py-a">{t('cc.a.agreements')}</label>
              <select id="py-a" className="input" value={pay.agreementId} onChange={(e) => setPay({ ...pay, agreementId: e.target.value })}>{active.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></div>}
            <div className="field"><label htmlFor="py-v">{t('cc.a.pay.amount')}</label><input id="py-v" className="input" inputMode="numeric" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></div>
            <div className="field"><label htmlFor="py-d">{t('cc.a.pay.date')}</label><input id="py-d" className="input" type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></div>
            <div className="field"><label htmlFor="py-m">{t('cc.a.pay.method')}</label><input id="py-m" className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} /></div>
          </div>
          <div className="row between g12 wrap">
            <label className="row g8 t-sm"><input type="checkbox" checked={pay.receipt} onChange={(e) => setPay({ ...pay, receipt: e.target.checked })} />{t('cc.a.pay.receipt')}</label>
            <button className="btn btn-primary btn-sm" disabled={!Number(pay.amount.replace(/\D/g, ''))} onClick={record}>{t('cc.a.pay.save')}</button>
          </div>
        </div>
      )}
    </section>
  );
}
