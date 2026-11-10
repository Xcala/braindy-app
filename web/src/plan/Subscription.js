import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { money, useBilling } from '../billing/useBilling';
import { HostingPlans } from './HostingPlans';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';
/** In Mi plan · The design plan being billed (subscription or project, with its status and next charge) and the full website hosting offer with the current plan outlined. */
export function Subscription({ current, part }) {
    const wa = useNicoWhatsApp();
    const { t, lang } = useI18n();
    const { plan } = useBilling(current?.id);
    if (plan === undefined)
        return _jsxs("p", { className: "t-mute", children: [t('common.loading'), "\u2026"] });
    const design = plan && (plan.monthly || plan.project) ? plan : null;
    const next = plan?.nextChargeAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', day: 'numeric' });
    const services = design ? [...(design.path === 'launch' ? [] : ['bill.s.social', 'bill.s.web', 'bill.s.report']), ...((design.addons ?? []).includes('agents') ? ['bill.s.agents'] : [])] : [];
    if (part === 'hosting')
        return _jsx(HostingPlans, { current: plan?.hosting, brandName: current.name });
    return (_jsx("div", { className: "col g24", children: _jsxs("section", { className: "card col g12", "aria-labelledby": "plan-d", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("span", { className: "col g4", children: [_jsx("span", { className: "label", id: "plan-d", children: t('plan.design') }), design && _jsx("span", { className: "h2", children: t(`bill.path.${design.path ?? 'transform'}`) })] }), design && _jsx("span", { className: `chip ${design.status === 'active' ? 'c-active' : design.status === 'past_due' ? 'c-lost' : 'c-draft'}`, children: t(`bill.status.${design.status ?? 'pending'}`) })] }), design ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "t-sm t-mute", children: t(`bill.pathSub.${design.path ?? 'transform'}`) }), _jsx("div", { className: "row g8 wrap", children: services.map((s) => _jsx("span", { className: "chip c-approved", children: t(s) }, s)) }), _jsxs("div", { className: "row between g12 wrap", style: { borderTop: '1px solid var(--line)', paddingTop: 12 }, children: [_jsxs("span", { className: "col", children: [_jsx("span", { className: "w7", children: design.monthly ? t('plan.monthly', { amount: money(design.monthly, design.currency, lang) }) : t('plan.project', { amount: money(design.project, design.currency, lang) }) }), next && _jsx("span", { className: "t-xs t-mute", children: t('plan.next', { date: next }) })] }), design.status === 'pending' || design.status === 'transfer_review'
                                    ? _jsx(Link, { className: "btn btn-primary btn-sm", to: "/pay", children: t('bill.payNow') })
                                    : _jsx(Link, { className: "btn btn-secondary btn-sm", to: "/settings?tab=billing", children: t('plan.payments') })] })] })) : (_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "t-sm t-mute", children: t('plan.noDesign') }), _jsx("a", { className: "btn btn-secondary btn-sm", style: { alignSelf: 'flex-start' }, href: wa(t('plan.design')), target: "_blank", rel: "noreferrer", children: t('plan.talk') })] }))] }) }));
}
