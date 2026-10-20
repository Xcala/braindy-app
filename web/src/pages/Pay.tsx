import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { billingApi, money, useBilling } from '../billing/useBilling';
import { CONTACT } from '../proposals/public/copy';

/** Day 0 · Payment and access (design 17/20): choose how to pay, invoice details, secure page or transfer. */
export function Pay() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const { plan } = useBilling(current?.id);
  const [option, setOption] = useState<'monthly' | 'project'>('monthly');
  const [d, setD] = useState({ company: '', taxId: '', email: '', whatsapp: '' });
  const [agree, setAgree] = useState(false);
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (plan?.invoiceDetails) setD((x) => ({ ...x, ...plan.invoiceDetails })); }, [plan?.invoiceDetails]);
  useEffect(() => { if (plan && !plan.monthly && plan.project) setOption('project'); }, [plan]);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  if (plan === undefined) return <p className="t-mute">{t('common.loading')}…</p>;
  if (!plan || (!plan.monthly && !plan.project)) return <div className="card t-mute">{t('bill.noPlan')}</div>;

  const today = option === 'project' ? (plan.project ?? 0) * 0.5 : plan.monthly ?? 0;
  const detailsOk = d.company.trim() && d.email.includes('@');
  async function saveDetails() { await billingApi.details(current!.id, d); }
  async function pay() {
    setBusy(true); setMsg(null);
    try { await saveDetails(); window.location.href = (await billingApi.checkout(current!.id, option)).url; }
    catch (e) { setMsg({ ok: false, text: String(e).includes('503') ? t('pay.notReady') : t('pay.error') }); setBusy(false); }
  }
  async function transfer() {
    setBusy(true); setMsg(null);
    try { await saveDetails(); await billingApi.transfer(current!.id, ref, today); setMsg({ ok: true, text: t('pay.transferSent') }); setRef(''); }
    catch { setMsg({ ok: false, text: t('pay.error') }); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto col g24 w-full max-w-[760px]">
      {params.get('state') === 'canceled' && (
        <div className="card col g8" role="alert" style={{ borderColor: '#F5D98A', background: '#FFFBF0' }}>
          <span className="w7">{t('pay.failedTitle')}</span><span className="t-sm">{t('pay.failedBody')}</span>
          <a className="t-sm w7" href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer">{t('pay.whatsappNicolas')}</a>
        </div>
      )}
      {params.get('state') === 'expired' && (
        <div className="card col g8" role="alert" style={{ borderColor: '#F5D98A', background: '#FFFBF0' }}>
          <span className="w7">{t('pay.expiredTitle')}</span><span className="t-sm">{t('pay.expiredBody')}</span>
        </div>
      )}
      {plan.status === 'transfer_review' && <div className="card t-sm" role="status">{t('pay.transferReview')} <Link to="/onboarding" className="w7">{t('pay.startBrief')}</Link></div>}
      <div className="col g8"><p className="label">{t('ob.day0')} · {current.name}</p><h1 className="h1">{t('pay.title')}</h1><p className="t-mute">{t(`bill.pathSub.${plan.path ?? 'transform'}`)}</p></div>
      {plan.monthly && plan.project ? (
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t('pay.how')}>
          {(['monthly', 'project'] as const).map((o) => (
            <button key={o} role="radio" aria-checked={option === o} onClick={() => setOption(o)} className="card col g4 text-left" style={{ cursor: 'pointer', borderColor: option === o ? '#2F4DE0' : undefined, boxShadow: option === o ? '0 0 0 2px #2F4DE0' : undefined }}>
              <span className="w7">{t(`pay.opt.${o}`)}</span><span className="t-sm t-mute">{t(`pay.opt.${o}Sub`)}</span>
              <span className="w7">{o === 'monthly' ? `${money(plan.monthly, plan.currency, lang)} / ${t('pay.month')}` : `${money(plan.project, plan.currency, lang)} + ${money(plan.monthly, plan.currency, lang)} / ${t('pay.month')}`}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="card row between g12 wrap"><span className="col"><span className="w7">{t('pay.today')}</span><span className="t-xs t-mute">{t(option === 'project' ? 'pay.todayProject' : 'pay.todayMonthly')}</span></span><span className="h2">{money(today, plan.currency, lang)}</span></div>
      <div className="card col g12">
        <h2 className="h3">{t('pay.details')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['company', 'taxId', 'email', 'whatsapp'] as const).map((k) => (
            <div key={k} className="field"><label htmlFor={`pay-${k}`}>{t(`pay.f.${k}`)}</label>
              <input id={`pay-${k}`} className="input" value={d[k]} type={k === 'email' ? 'email' : 'text'} onChange={(e) => setD({ ...d, [k]: e.target.value })} /></div>
          ))}
        </div>
        {params.get('edit') === 'details' && <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => saveDetails().then(() => setMsg({ ok: true, text: t('set.saved') }))}>{t('set.save')}</button>}
      </div>
      <label className="row g8 t-sm" style={{ cursor: 'pointer' }}><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> {t('pay.agree')}</label>
      <div className="row g12 wrap">
        <button className="btn btn-primary btn-lg" disabled={!agree || !detailsOk || busy} onClick={pay}>{t('pay.continue')}</button>
        <span className="t-xs t-mute">{t('pay.secure')}</span>
      </div>
      <details className="card">
        <summary className="w7 t-sm" style={{ cursor: 'pointer' }}>{t('pay.byTransfer')}</summary>
        <div className="col g8" style={{ marginTop: 12 }}>
          <p className="t-sm t-mute">{t('pay.transferHelp')}</p>
          <div className="row g8 wrap"><input className="input grow" value={ref} onChange={(e) => setRef(e.target.value)} placeholder={t('pay.transferRef')} aria-label={t('pay.transferRef')} />
            <button className="btn btn-secondary" disabled={!ref.trim() || !detailsOk || !agree || busy} onClick={transfer}>{t('pay.sendTransfer')}</button></div>
        </div>
      </details>
      {msg && <p className="t-sm" role="status" style={{ color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
      <div className="card col g4"><span className="w7 t-sm">{t('pay.after')}</span><span className="t-sm t-mute">{t('pay.afterBody')}</span></div>
    </div>
  );
}

export function PaySuccess() {
  const { t } = useI18n();
  return (
    <div className="mx-auto col g20 w-full max-w-[640px]">
      <div className="stage col g12 rounded-[20px] p-6 sm:p-9">
        <h1 className="d-lg" style={{ color: '#fff' }}><span className="w9">{t('pay.okTitle1')}</span> {t('pay.okTitle2')}</h1>
        <p className="t-lg muted">{t('pay.okBody')}</p>
        <div className="row g12 wrap"><Link className="btn btn-white" to="/onboarding">{t('pay.startBrief')}</Link><Link className="btn btn-outline-light" to="/settings?tab=billing">{t('pay.receipt')}</Link></div>
      </div>
      <div className="card row g12"><img src="/brand/proposal/b3d-researcher.jpg" alt="" className="h-12 w-12 rounded-xl object-cover" />
        <div className="col"><span className="w7 t-sm">{t('pay.researcherWaits')}</span><span className="t-xs t-mute">{t('pay.eightQuestions')}</span></div></div>
    </div>
  );
}
