import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { HOSTING, HOSTING_USD, money, useBilling } from '../billing/useBilling';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';


/** My plan: what the brand has with Braindy, the design plan and the site hosting plan, on one screen. */
export function MyPlan() {
  const wa = useNicoWhatsApp();
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const { plan } = useBilling(current?.id);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  if (plan === undefined) return <p className="t-mute">{t('common.loading')}…</p>;
  const design = plan && (plan.monthly || plan.project) ? plan : null;
  const next = plan?.nextChargeAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', day: 'numeric' });
  const services = design ? [...(design.path === 'launch' ? [] : ['bill.s.social', 'bill.s.web', 'bill.s.report'] as const), ...((design.addons ?? []).includes('agents') ? ['bill.s.agents'] as const : [])] : [];

  return (
    <div className="mx-auto col g24 w-full max-w-[860px]">
      <div className="col g8"><p className="label">{current.name}</p><h1 className="h1">{t('plan.title')}</h1><p className="t-mute">{t('plan.sub')}</p></div>

      <section className="card col g12" aria-labelledby="plan-d">
        <div className="row between g8 wrap">
          <span className="col g4"><span className="label" id="plan-d">{t('plan.design')}</span>
            {design && <span className="h2">{t(`bill.path.${design.path ?? 'transform'}`)}</span>}</span>
          {design && <span className={`chip ${design.status === 'active' ? 'c-active' : design.status === 'past_due' ? 'c-lost' : 'c-draft'}`}>{t(`bill.status.${design.status ?? 'pending'}`)}</span>}
        </div>
        {design ? (
          <>
            <p className="t-sm t-mute">{t(`bill.pathSub.${design.path ?? 'transform'}`)}</p>
            <div className="row g8 wrap">{services.map((s) => <span key={s} className="chip c-approved">{t(s)}</span>)}</div>
            <div className="row between g12 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <span className="col"><span className="w7">{design.monthly ? t('plan.monthly', { amount: money(design.monthly, design.currency, lang) }) : t('plan.project', { amount: money(design.project, design.currency, lang) })}</span>
                {next && <span className="t-xs t-mute">{t('plan.next', { date: next })}</span>}</span>
              {design.status === 'pending' || design.status === 'transfer_review'
                ? <Link className="btn btn-primary btn-sm" to="/pay">{t('bill.payNow')}</Link>
                : <Link className="btn btn-secondary btn-sm" to="/settings?tab=billing">{t('plan.payments')}</Link>}
            </div>
          </>
        ) : (
          <div className="col g8"><p className="t-sm t-mute">{t('plan.noDesign')}</p>
            <a className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} href={wa(t('plan.design'))} target="_blank" rel="noreferrer">{t('plan.talk')}</a></div>
        )}
      </section>

      <section className="col g12" aria-labelledby="plan-h">
        <h2 className="h3" id="plan-h">{t('plan.hosting')}</h2>
        {!plan?.hosting && <p className="t-sm t-mute">{t('plan.noHosting')}</p>}
        <div className="grid gap-3 md:grid-cols-3">
          {HOSTING.map((h) => {
            const mine = plan?.hosting === h;
            return (
              <div key={h} className="card col g8" style={mine ? { borderColor: '#2F4DE0', boxShadow: '0 0 0 2px #2F4DE0' } : plan?.hosting ? { opacity: 0.75 } : undefined}>
                <div className="row between g8"><span className="h3">{t(`plan.h.${h}`)}</span>{mine && <span className="chip c-active">{t('plan.current')}</span>}</div>
                <span className="w7">{t('plan.monthly', { amount: money(HOSTING_USD[h], 'usd', lang) })}</span>
                <span className="t-sm">{t(`plan.h.${h}For`)}</span>
                <span className="t-xs t-mute grow">{t(`plan.h.${h}Spec`)}</span>
                {!mine && <a className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} href={wa(`${t('plan.hosting')} ${t(`plan.h.${h}`)} · ${current.name}`)} target="_blank" rel="noreferrer">{plan?.hosting ? t('plan.change') : t('plan.activate')}</a>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
