import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../../i18n/I18nProvider';
import { CuentasList } from '../CuentasList';
import { CuentasClient } from '../CuentasClient';
import { cuentasApi, errKey, type Agreement, type Cuenta, type Profile } from '../api';
import { AgreementForm } from './AgreementForm';
import { IssuerSettings } from './IssuerSettings';
import { BillingFiles } from '../BillingFiles';
import { AdminSummary, clientView } from './AdminSummary';
import { ProjectCard } from './ProjectCard';

const EMPTY_PROFILE: Profile = { legalName: '', taxId: '', address: '', city: '', accountingEmail: '', accountingWhatsApp: '' };
/** «Plan con tarjeta» lives further down in Pagos (PaymentsTab); the empty state opens it. */
export const CARD_PLAN_ID = 'pg-card-plan';

/** NickMark's side of a brand's cuentas de cobro: the money first (owed, paid, progress), warnings, each project, every
 *  cuenta and recibo, and the setup (client billing data, documents) folded at the bottom. «Ver como cliente» shows
 *  what billing people see. A brand with nothing yet gets one card to choose how it is charged. */
export function CuentasAdmin({ brandId, onHas }: { brandId: string; onHas?: (has: boolean) => void }) {
  const { t } = useI18n();
  const [data, setData] = useState<{ profile: Profile | null; billingPeople?: number; agreements: Agreement[]; docs: Cuenta[] } | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [form, setForm] = useState<Agreement | 'new' | null>(null);
  const [setup, setSetup] = useState(false);
  const [asClient, setAsClient] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [nitBad, setNitBad] = useState(false);
  const load = useCallback(() => cuentasApi.all(brandId)
    .then((d) => { setData(d); setProfile({ ...EMPTY_PROFILE, ...(d.profile ?? {}) }); onHas?.(d.agreements.length > 0 || d.docs.length > 0); })
    .catch(() => setData({ profile: null, agreements: [], docs: [] })), [brandId, onHas]);
  useEffect(() => { load(); }, [load]);
  if (!data) return null;

  const saveProfile = () => cuentasApi.saveProfile(brandId, profile).then((r) => { setNitBad(r.nitOk === false); setMsg(t('cc.a.saved')); load(); }).catch((e) => setMsg(t(errKey(e) as never)));
  const empty = !data.agreements.length && !data.docs.length;
  // Warnings only matter once there is something to send.
  const live = data.docs.some((d) => d.type === 'cuenta_cobro' && d.status !== 'scheduled' && d.status !== 'void');
  const noContact = !!data.profile && !data.profile.accountingEmail && !data.profile.accountingWhatsApp;
  const nobody = live && (data.billingPeople ?? 0) === 0;
  const fixContact = () => { setSetup(true); setTimeout(() => document.getElementById('bp-accountingEmail')?.focus(), 50); };
  const cardPlan = () => { const d = document.getElementById(CARD_PLAN_ID) as HTMLDetailsElement | null; if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  const input = (id: keyof Profile, label: string) => (
    <div className="field"><label htmlFor={`bp-${id}`}>{label}</label><input id={`bp-${id}`} className="input" value={profile[id] ?? ''} onChange={(e) => setProfile({ ...profile, [id]: e.target.value })} /></div>
  );
  const view = asClient ? clientView(data.agreements, data.docs) : null;

  return (
    <section className="col g16" aria-labelledby="cc-admin-h">
      <div className="row between g12 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="col g4"><p className="label">{t('cc.a.only')}</p><h2 className="h2" id="cc-admin-h">{t('cc.a.title')}</h2></div>
        {data.docs.length > 0 && <button className="btn btn-secondary btn-sm" aria-pressed={asClient} onClick={() => setAsClient(!asClient)}>{t(asClient ? 'pg.a.asAdmin' : 'pg.a.asClient')}</button>}
      </div>
      {msg && <p className="t-sm" role="status">{msg}</p>}

      {view ? (
        <>
          <p className="cc-warn t-sm" role="note">{t('pg.a.asClientNote')}</p>
          {view.docs.length ? <CuentasClient brandId={brandId} docs={view.docs} projects={view.projects} feePct={0} reload={load} preview /> : <p className="t-sm t-mute">{t('cc.empty')}</p>}
        </>
      ) : (
        <>
          {empty && !form && (
            <div className="card col g12">
              <div className="col g2"><h3 className="w7" style={{ margin: 0 }}>{t('pg.e.title')}</h3><p className="t-sm t-mute" style={{ margin: 0 }}>{t('pg.e.lead')}</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button className="card card-tight col g4 text-left" onClick={() => setForm('new')}><span className="t-sm w7">{t('pg.e.cuentas')}</span><span className="t-xs t-mute">{t('pg.e.cuentasHint')}</span></button>
                <button className="card card-tight col g4 text-left" onClick={cardPlan}><span className="t-sm w7">{t('pg.e.card')}</span><span className="t-xs t-mute">{t('pg.e.cardHint')}</span></button>
              </div>
            </div>
          )}
          <AdminSummary agreements={data.agreements} docs={data.docs} />
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
          {!empty && <IssuerSettings onlyIfMissing />}

          {(data.agreements.length > 0 || form) && (
            <div className="col g8">
              <div className="row between g12 wrap">
                <p className="label">{t('cc.a.agreements')}</p>
                {!form && <button className="btn btn-secondary btn-sm" onClick={() => setForm('new')}>{t('cc.a.new')}</button>}
              </div>
              {data.agreements.map((a) => <ProjectCard key={a.id} brandId={brandId} a={a} docs={data.docs} onEdit={() => setForm(a)} onSaved={(m) => { if (m) setMsg(m); load(); }} />)}
              {form && <AgreementForm brandId={brandId} initial={form === 'new' ? undefined : form} onDone={(m) => { setForm(null); if (m) setMsg(m); load(); }} />}
            </div>
          )}

          {data.docs.length > 0 && <CuentasList brandId={brandId} docs={data.docs} reload={load} sendTo={{ profile: data.profile, people: data.billingPeople ?? 0 }} />}

          {(!empty || form) && (
            <details className="cc-fold" open={setup || (!data.profile && !!form)} onToggle={(e) => setSetup((e.target as HTMLDetailsElement).open)}>
              <summary>{t('pg.a.setup')} <span className="t-sm t-mute" style={{ fontWeight: 400 }}>· {t('cc.a.profile')}{data.profile ? ` (${data.profile.legalName})` : ''} · {t('cc.f.title')}</span></summary>
              <div className="col g16">
                <div className="col g12">
                  <p className="label" style={{ margin: 0 }}>{t('cc.a.profile')}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {input('legalName', t('cc.a.legalName'))}{input('taxId', t('cc.a.taxId'))}{input('address', t('cc.a.address'))}{input('city', t('cc.a.city'))}
                    {input('accountingEmail', t('cc.a.email'))}{input('accountingWhatsApp', t('cc.a.wa'))}
                  </div>
                  {nitBad && <p className="t-sm" role="alert">{t('cc.a.nitBad')}</p>}
                  <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-secondary btn-sm" onClick={saveProfile}>{t('set.save')}</button></div>
                </div>
                <BillingFiles brandId={brandId} admin />
              </div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
