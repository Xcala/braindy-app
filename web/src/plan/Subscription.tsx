import { Link } from 'react-router';
import type { Brand } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { money, useBilling } from '../billing/useBilling';
import { HostingPlans } from './HostingPlans';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';


/** In Mi plan · The design plan being billed (subscription or project, with its status and next charge) and the full website hosting offer with the current plan outlined. */
export function Subscription({ current, part }: { current: Brand; part: 'design' | 'hosting' }) {
  const wa = useNicoWhatsApp();
  const { t, lang } = useI18n();
  const { plan } = useBilling(current?.id);
  if (plan === undefined) return <p className="t-mute">{t('common.loading')}…</p>;
  const design = plan && (plan.monthly || plan.project) ? plan : null;
  const next = plan?.nextChargeAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', day: 'numeric' });
  const services = design ? [...(design.path === 'launch' ? [] : ['bill.s.social', 'bill.s.web', 'bill.s.report'] as const), ...((design.addons ?? []).includes('agents') ? ['bill.s.agents'] as const : [])] : [];

  if (part === 'hosting') return <HostingPlans current={plan?.hosting} brandName={current.name} brandId={current.id} paid={plan?.hostingStatus === 'active' || plan?.hostingStatus === 'past_due'} />;
  return (
    <div className="col g24">

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
            <div className="row between g12 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: '0.75rem' }}>
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
    </div>
  );
}
