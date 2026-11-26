import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../../i18n/I18nProvider';
import { CuentasList } from '../CuentasList';
import { cuentasApi, errKey, money, type Agreement, type Cuenta, type Profile, type Progress } from '../api';
import { AgreementForm } from './AgreementForm';
import { IssuerSettings } from './IssuerSettings';
import { BillingFiles } from '../BillingFiles';
import { PaymentForm } from './PaymentForm';
import { paidOf } from './PayProgress';
import { ProjectBars } from './ProjectBars';

const EMPTY_PROFILE: Profile = { legalName: '', taxId: '', address: '', city: '', accountingEmail: '', accountingWhatsApp: '' };

/** NickMark's side of a brand's cuentas de cobro: warnings first (nobody to send to, nobody who sees Billing), the
 *  client's billing data, the projects with what is paid and «Registrar pago» on each, every cuenta and recibo. */
export function CuentasAdmin({ brandId, onHas }: { brandId: string; onHas?: (has: boolean) => void }) {
  const { t } = useI18n();
  const [data, setData] = useState<{ profile: Profile | null; billingPeople?: number; progress?: Progress | null; agreements: Agreement[]; docs: Cuenta[] } | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [form, setForm] = useState<Agreement | 'new' | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [nitBad, setNitBad] = useState(false);
  const load = useCallback(() => cuentasApi.all(brandId)
    .then((d) => { setData(d); setProfile({ ...EMPTY_PROFILE, ...(d.profile ?? {}) }); onHas?.(d.agreements.length > 0 || d.docs.length > 0); })
    .catch(() => setData({ profile: null, agreements: [], docs: [] })), [brandId, onHas]);
  useEffect(() => { load(); }, [load]);
  if (!data) return null;

  const saveProfile = () => cuentasApi.saveProfile(brandId, profile).then((r) => { setNitBad(r.nitOk === false); setMsg(t('cc.a.saved')); load(); }).catch((e) => setMsg(t(errKey(e) as never)));
  // Warnings only matter once there is something to send.
  const live = data.docs.some((d) => d.type === 'cuenta_cobro' && d.status !== 'scheduled' && d.status !== 'void');
  const noContact = !!data.profile && !data.profile.accountingEmail && !data.profile.accountingWhatsApp;
  const nobody = live && (data.billingPeople ?? 0) === 0;
  const fixContact = () => { setOpenProfile(true); setTimeout(() => document.getElementById('bp-accountingEmail')?.focus(), 50); };
  const input = (id: keyof Profile, label: string) => (
    <div className="field"><label htmlFor={`bp-${id}`}>{label}</label><input id={`bp-${id}`} className="input" value={profile[id] ?? ''} onChange={(e) => setProfile({ ...profile, [id]: e.target.value })} /></div>
  );

  return (
    <section className="col g16" aria-labelledby="cc-admin-h">
      <div className="col g4"><p className="label">{t('cc.a.only')}</p><h2 className="h2" id="cc-admin-h">{t('cc.a.title')}</h2></div>
      {msg && <p className="t-sm" role="status">{msg}</p>}
      {(noContact || nobody) && (
        <div className="cc-warn col g12" role="note">
          {noContact && (
            <div className="row between g12 wrap"><span className="t-sm" style={{ minWidth: 0, flex: '1 1 16rem' }}><b>{t('cc.w.noContact')}</b> {t('cc.w.noContactHint')}</span>
              <button className="btn btn-secondary btn-sm" onClick={fixContact}>{t('cc.w.addContact')}</button></div>
          )}
          {nobody && (
            <div className="row between g12 wrap"><span className="t-sm" style={{ minWidth: 0, flex: '1 1 16rem' }}><b>{t('cc.w.nobody')}</b> {t('cc.w.nobodyHint')}</span>
              <Link className="btn btn-secondary btn-sm" to="/settings">{t('cc.w.grant')}</Link></div>
          )}
        </div>
      )}
      <IssuerSettings onlyIfMissing />

      <details className="card col g12" open={!data.profile || openProfile} onToggle={(e) => setOpenProfile((e.target as HTMLDetailsElement).open)}>
        <summary className="w7">{t('cc.a.profile')}{data.profile ? ` · ${data.profile.legalName}` : ''}</summary>
        <div className="grid gap-3 sm:grid-cols-2" style={{ marginTop: '0.75rem' }}>
          {input('legalName', t('cc.a.legalName'))}{input('taxId', t('cc.a.taxId'))}{input('address', t('cc.a.address'))}{input('city', t('cc.a.city'))}
          {input('accountingEmail', t('cc.a.email'))}{input('accountingWhatsApp', t('cc.a.wa'))}
        </div>
        {nitBad && <p className="t-sm" role="alert">{t('cc.a.nitBad')}</p>}
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-secondary btn-sm" onClick={saveProfile}>{t('set.save')}</button></div>
      </details>

      <BillingFiles brandId={brandId} admin />

      <div className="col g8">
        <div className="row between g12 wrap">
          <p className="label">{t('cc.a.agreements')}</p>
          {!form && <button className="btn btn-secondary btn-sm" onClick={() => setForm('new')}>{t('cc.a.new')}</button>}
        </div>
        {data.agreements.map((a) => {
          const paid = paidOf(a, data.docs);
          return (
            <div key={a.id} className="card card-tight col g8">
              <div className="row between g12 wrap">
                <span className="col g2" style={{ minWidth: 0, flex: '1 1 16rem' }}>
                  <span className="t-sm"><b>{a.title}</b> · {money(a.totalAmount, a.currency)} · {a.installments} · {a.numberingPrefix}{a.currency === 'USD' ? ' · USA' : ''}</span>
                </span>
                <span className="row g8 wrap">
                  <span className="chip">{t(`cc.a.${a.status}` as never)}</span>
                  {a.status === 'draft' && <button className="btn btn-ghost btn-sm" onClick={() => setForm(a)}>{t('bill.edit')}</button>}
                  {a.status === 'active' && paid < a.totalAmount && (
                    <button className="btn btn-secondary btn-sm" aria-expanded={paying === a.id} onClick={() => setPaying(paying === a.id ? null : a.id)}>{t(paying === a.id ? 'common.cancel' : 'cc.a.payment')}</button>
                  )}
                </span>
              </div>
              {a.status !== 'draft' && <ProjectBars agreement={a} paid={paid} progress={data.progress} />}
              {paying === a.id && <PaymentForm brandId={brandId} agreement={a} docs={data.docs} onDone={(m) => { setPaying(null); setMsg(m); load(); }} />}
            </div>
          );
        })}
        {form && <AgreementForm brandId={brandId} initial={form === 'new' ? undefined : form} onDone={(m) => { setForm(null); if (m) setMsg(m); load(); }} />}
      </div>

      <CuentasList brandId={brandId} docs={data.docs} admin reload={load} sendTo={{ profile: data.profile, people: data.billingPeople ?? 0 }} />
    </section>
  );
}
