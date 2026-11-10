import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { billingApi, money, useBilling } from '../billing/useBilling';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';
const SERVICES = [
    { key: 'social', title: 'bill.s.social', body: 'bill.s.socialBody' },
    { key: 'web', title: 'bill.s.web', body: 'bill.s.webBody' },
    { key: 'report', title: 'bill.s.report', body: 'bill.s.reportBody' },
    { key: 'agents', title: 'bill.s.agents', body: 'bill.s.agentsBody' },
    { key: 'print', title: 'bill.s.print', body: 'bill.s.printBody' },
];
/** Settings · Billing (design 20): plan, services, next charge, payment method, invoices, cancellation. */
export function BillingCard({ brandId }) {
    const wa = useNicoWhatsApp();
    const { t, lang } = useI18n();
    const { plan, invoices } = useBilling(brandId);
    const [cancel, setCancel] = useState(false);
    const [adding, setAdding] = useState(false);
    const [msg, setMsg] = useState(null);
    if (plan === undefined)
        return _jsxs("div", { className: "card t-mute", children: [t('common.loading'), "\u2026"] });
    if (plan === null)
        return _jsxs("div", { className: "card col g8", children: [_jsx("p", { className: "t-mute", children: t('bill.noPlan') }), _jsx("a", { className: "btn btn-secondary btn-sm", style: { alignSelf: 'flex-start' }, href: wa(), target: "_blank", rel: "noreferrer", children: t('home.talk') })] });
    const included = new Set(plan.path === 'continuity' || plan.path === 'transform' ? ['social', 'web', 'report', ...(plan.addons ?? [])] : plan.addons ?? []);
    const next = plan.nextChargeAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const go = async (fn) => { try {
        window.location.href = (await fn()).url;
    }
    catch {
        setMsg(t('bill.portalError'));
    } };
    return (_jsxs("div", { className: "col g24", children: [_jsx("p", { className: "t-mute", children: t('bill.tagline') }), _jsxs("div", { className: "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]", children: [_jsxs("div", { className: "card col g12", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("div", { className: "col", children: [_jsx("span", { className: "label", children: t('bill.yourPlan') }), _jsx("span", { className: "h2", children: t(`bill.path.${plan.path ?? 'transform'}`) }), _jsx("span", { className: "t-sm t-mute", children: t(`bill.pathSub.${plan.path ?? 'transform'}`) })] }), _jsx("span", { className: `chip ${plan.status === 'active' ? 'c-active' : plan.status === 'past_due' ? 'c-lost' : 'c-draft'}`, children: t(`bill.status.${plan.status ?? 'pending'}`) })] }), SERVICES.map((s) => (_jsxs("div", { className: "row between g12", style: { padding: '10px 0', borderTop: '1px solid var(--line)' }, children: [_jsxs("span", { className: "col", children: [_jsx("span", { className: "w7 t-sm", children: t(s.title) }), _jsx("span", { className: "t-xs t-mute", children: t(s.body) })] }), included.has(s.key) ? _jsx("span", { className: "chip c-approved", children: t('bill.inPlan') })
                                        : s.key === 'agents'
                                            ? (plan.addonRequests ?? []).includes('agents') ? _jsx("span", { className: "chip c-draft", children: t('bill.requested') }) : _jsx("button", { className: "btn btn-secondary btn-sm", onClick: () => setAdding(true), children: t('bill.add') })
                                            : _jsx("a", { className: "btn btn-secondary btn-sm", href: wa(t(s.title)), target: "_blank", rel: "noreferrer", children: t('bill.quote') })] }, s.key)))] }), _jsxs("aside", { className: "col g16", children: [_jsxs("div", { className: "card col g8", children: [_jsx("span", { className: "t-sm t-mute w7", children: t('bill.nextCharge') }), _jsx("span", { className: "h2", children: money(plan.monthly, plan.currency, lang) }), _jsx("span", { className: "t-sm t-mute", children: next ?? '—' }), plan.status === 'pending' || plan.status === 'transfer_review'
                                        ? _jsx(Link, { className: "btn btn-primary btn-sm", to: "/pay", children: t('bill.payNow') })
                                        : _jsx("button", { className: "btn btn-secondary btn-sm", disabled: !plan.stripeCustomerId, onClick: () => go(() => billingApi.portal(brandId)), children: t('bill.updateMethod') })] }), _jsxs("div", { className: "card col g8", children: [_jsx("span", { className: "t-sm w7", children: t('bill.braintrust') }), _jsx("span", { className: "t-xs t-mute", children: t('bill.braintrustSub') })] })] })] }), _jsxs("section", { className: "card col g8", "aria-labelledby": "inv-h", children: [_jsx("h2", { className: "h3", id: "inv-h", children: t('bill.invoices') }), invoices.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('bill.noInvoices') }), invoices.map((i) => (_jsxs("div", { className: "row between g12 wrap t-sm", style: { padding: '8px 0', borderTop: '1px solid var(--line)' }, children: [_jsx("span", { style: { minWidth: 110 }, children: i.date?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }), _jsx("span", { className: "grow truncate", children: i.concept }), _jsx("span", { className: "w7", children: money(i.amount, i.currency, lang) }), _jsx("span", { className: `chip ${i.status === 'paid' ? 'c-approved' : 'c-lost'}`, children: t(`bill.inv.${i.status}`) }), (i.pdfUrl || i.hostedUrl) ? _jsx("a", { href: (i.pdfUrl ?? i.hostedUrl), target: "_blank", rel: "noreferrer", className: "w7", children: "PDF" }) : _jsx("span", { className: "t-mute", children: "\u2014" })] }, i.id)))] }), _jsxs("div", { className: "card row between g12 wrap", children: [_jsxs("span", { className: "col", children: [_jsx("span", { className: "w7 t-sm", children: t('bill.details') }), _jsx("span", { className: "t-sm t-mute", children: [plan.invoiceDetails?.company, plan.invoiceDetails?.taxId && `NIT ${plan.invoiceDetails.taxId}`, plan.invoiceDetails?.email].filter(Boolean).join(' · ') || '—' })] }), _jsx(Link, { className: "btn btn-ghost btn-sm", to: "/pay?edit=details", children: t('bill.edit') })] }), _jsxs("div", { className: "row between g12 wrap", children: [_jsx("span", { className: "t-sm t-mute", children: plan.cancelRequestedAt ? t('bill.cancelRequested') : t('bill.cancelNote') }), !plan.cancelRequestedAt && _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => setCancel(true), children: t('bill.requestCancel') })] }), msg && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: msg }), adding && (_jsx(ConfirmDialog, { title: t('bill.addTitle'), confirmLabel: plan.agentsMonthly && plan.stripeCustomerId ? t('bill.addConfirm') : t('bill.addRequest'), onConfirm: async () => { try {
                    await billingApi.addon(brandId);
                    setAdding(false);
                }
                catch {
                    setMsg(t('bill.portalError'));
                    setAdding(false);
                } }, onCancel: () => setAdding(false), children: _jsxs("span", { className: "col g8", children: [_jsx("span", { children: t('bill.s.agentsBody') }), plan.agentsMonthly ? _jsx("b", { children: t('bill.addTotal', { total: money((plan.monthly ?? 0) + plan.agentsMonthly, plan.currency, lang) }) }) : null, _jsx("span", { className: "t-sm", children: plan.agentsMonthly && plan.stripeCustomerId ? t('bill.addProrated') : t('bill.addAsk') })] }) })), cancel && (_jsx(ConfirmDialog, { title: t('bill.cancelTitle'), confirmLabel: t('bill.requestCancel'), danger: true, onConfirm: async () => { await billingApi.cancelRequest(brandId); setCancel(false); }, onCancel: () => setCancel(false), children: t('bill.cancelBody') }))] }));
}
