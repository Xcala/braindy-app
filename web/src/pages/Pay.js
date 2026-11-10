import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { billingApi, money, useBilling } from '../billing/useBilling';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';
/** Step 1 · Payment and access (design 17/20): choose how to pay, invoice details, secure page or transfer. */
export function Pay() {
    const wa = useNicoWhatsApp();
    const { current } = useBrands();
    const { t, lang } = useI18n();
    const [params] = useSearchParams();
    const { plan } = useBilling(current?.id);
    const [option, setOption] = useState('monthly');
    const [d, setD] = useState({ company: '', taxId: '', email: '', whatsapp: '' });
    const [agree, setAgree] = useState(false);
    const [ref, setRef] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    useEffect(() => { if (plan?.invoiceDetails)
        setD((x) => ({ ...x, ...plan.invoiceDetails })); }, [plan?.invoiceDetails]);
    useEffect(() => { if (plan && !plan.monthly && plan.project)
        setOption('project'); }, [plan]);
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    if (plan === undefined)
        return _jsxs("p", { className: "t-mute", children: [t('common.loading'), "\u2026"] });
    if (!plan || (!plan.monthly && !plan.project))
        return _jsx("div", { className: "card t-mute", children: t('bill.noPlan') });
    const today = option === 'project' ? (plan.project ?? 0) * 0.5 : plan.monthly ?? 0;
    const detailsOk = d.company.trim() && d.email.includes('@');
    async function saveDetails() { await billingApi.details(current.id, d); }
    async function pay() {
        setBusy(true);
        setMsg(null);
        try {
            await saveDetails();
            window.location.href = (await billingApi.checkout(current.id, option)).url;
        }
        catch (e) {
            setMsg({ ok: false, text: String(e).includes('503') ? t('pay.notReady') : t('pay.error') });
            setBusy(false);
        }
    }
    async function transfer() {
        setBusy(true);
        setMsg(null);
        try {
            await saveDetails();
            await billingApi.transfer(current.id, ref, today);
            setMsg({ ok: true, text: t('pay.transferSent') });
            setRef('');
        }
        catch {
            setMsg({ ok: false, text: t('pay.error') });
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "mx-auto col g24 w-full max-w-[760px]", children: [params.get('state') === 'canceled' && (_jsxs("div", { className: "card col g8", role: "alert", style: { borderColor: '#F5D98A', background: '#FFFBF0' }, children: [_jsx("span", { className: "w7", children: t('pay.failedTitle') }), _jsx("span", { className: "t-sm", children: t('pay.failedBody') }), _jsx("a", { className: "t-sm w7", href: wa(), target: "_blank", rel: "noreferrer", children: t('pay.whatsappNicolas') })] })), params.get('state') === 'expired' && (_jsxs("div", { className: "card col g8", role: "alert", style: { borderColor: '#F5D98A', background: '#FFFBF0' }, children: [_jsx("span", { className: "w7", children: t('pay.expiredTitle') }), _jsx("span", { className: "t-sm", children: t('pay.expiredBody') })] })), plan.status === 'transfer_review' && _jsxs("div", { className: "card t-sm", role: "status", children: [t('pay.transferReview'), " ", _jsx(Link, { to: "/onboarding", className: "w7", children: t('pay.startBrief') })] }), _jsxs("div", { className: "col g8", children: [_jsxs("p", { className: "label", children: [t('ob.day0'), " \u00B7 ", current.name] }), _jsx("h1", { className: "h1", children: t('pay.title') }), _jsx("p", { className: "t-mute", children: t(`bill.pathSub.${plan.path ?? 'transform'}`) })] }), plan.monthly && plan.project ? (_jsx("div", { className: "grid gap-3 sm:grid-cols-2", role: "radiogroup", "aria-label": t('pay.how'), children: ['monthly', 'project'].map((o) => (_jsxs("button", { role: "radio", "aria-checked": option === o, onClick: () => setOption(o), className: "card col g4 text-left", style: { cursor: 'pointer', borderColor: option === o ? '#2F4DE0' : undefined, boxShadow: option === o ? '0 0 0 2px #2F4DE0' : undefined }, children: [_jsx("span", { className: "w7", children: t(`pay.opt.${o}`) }), _jsx("span", { className: "t-sm t-mute", children: t(`pay.opt.${o}Sub`) }), _jsx("span", { className: "w7", children: o === 'monthly' ? `${money(plan.monthly, plan.currency, lang)} / ${t('pay.month')}` : `${money(plan.project, plan.currency, lang)} + ${money(plan.monthly, plan.currency, lang)} / ${t('pay.month')}` })] }, o))) })) : null, _jsxs("div", { className: "card row between g12 wrap", children: [_jsxs("span", { className: "col", children: [_jsx("span", { className: "w7", children: t('pay.today') }), _jsx("span", { className: "t-xs t-mute", children: t(option === 'project' ? 'pay.todayProject' : 'pay.todayMonthly') })] }), _jsx("span", { className: "h2", children: money(today, plan.currency, lang) })] }), _jsxs("div", { className: "card col g12", children: [_jsx("h2", { className: "h3", children: t('pay.details') }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: ['company', 'taxId', 'email', 'whatsapp'].map((k) => (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: `pay-${k}`, children: t(`pay.f.${k}`) }), _jsx("input", { id: `pay-${k}`, className: "input", value: d[k], type: k === 'email' ? 'email' : 'text', onChange: (e) => setD({ ...d, [k]: e.target.value }) })] }, k))) }), params.get('edit') === 'details' && _jsx("button", { className: "btn btn-secondary btn-sm", style: { alignSelf: 'flex-start' }, onClick: () => saveDetails().then(() => setMsg({ ok: true, text: t('set.saved') })), children: t('set.save') })] }), _jsxs("label", { className: "row g8 t-sm", style: { cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: agree, onChange: (e) => setAgree(e.target.checked) }), " ", t('pay.agree')] }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("button", { className: "btn btn-primary btn-lg", disabled: !agree || !detailsOk || busy, onClick: pay, children: t('pay.continue') }), _jsx("span", { className: "t-xs t-mute", children: t('pay.secure') })] }), _jsxs("details", { className: "card", children: [_jsx("summary", { className: "w7 t-sm", style: { cursor: 'pointer' }, children: t('pay.byTransfer') }), _jsxs("div", { className: "col g8", style: { marginTop: 12 }, children: [_jsx("p", { className: "t-sm t-mute", children: t('pay.transferHelp') }), _jsxs("div", { className: "row g8 wrap", children: [_jsx("input", { className: "input grow", value: ref, onChange: (e) => setRef(e.target.value), placeholder: t('pay.transferRef'), "aria-label": t('pay.transferRef') }), _jsx("button", { className: "btn btn-secondary", disabled: !ref.trim() || !detailsOk || !agree || busy, onClick: transfer, children: t('pay.sendTransfer') })] })] })] }), msg && _jsx("p", { className: "t-sm", role: "status", style: { color: msg.ok ? 'var(--success)' : 'var(--danger)' }, children: msg.text }), _jsxs("div", { className: "card col g4", children: [_jsx("span", { className: "w7 t-sm", children: t('pay.after') }), _jsx("span", { className: "t-sm t-mute", children: t('pay.afterBody') })] })] }));
}
export function PaySuccess() {
    const { t } = useI18n();
    return (_jsxs("div", { className: "mx-auto col g20 w-full max-w-[640px]", children: [_jsxs("div", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", children: [_jsxs("h1", { className: "d-lg", style: { color: '#fff' }, children: [_jsx("span", { className: "w9", children: t('pay.okTitle1') }), " ", t('pay.okTitle2')] }), _jsx("p", { className: "t-lg muted", children: t('pay.okBody') }), _jsxs("div", { className: "row g12 wrap", children: [_jsx(Link, { className: "btn btn-white", to: "/onboarding", children: t('pay.startBrief') }), _jsx(Link, { className: "btn btn-outline-light", to: "/settings?tab=billing", children: t('pay.receipt') })] })] }), _jsxs("div", { className: "card row g12", children: [_jsx("img", { src: "/brand/proposal/b3d-researcher.jpg", alt: "", className: "h-12 w-12 rounded-xl object-cover" }), _jsxs("div", { className: "col", children: [_jsx("span", { className: "w7 t-sm", children: t('pay.researcherWaits') }), _jsx("span", { className: "t-xs t-mute", children: t('pay.eightQuestions') })] })] })] }));
}
