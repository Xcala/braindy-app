import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { planApi } from './usePlan';
import { EXAMPLE, EXAMPLE_STACK } from './example';
import { tidy } from './formFields';
import { EMPTY_PLAN, PlanForm } from './PlanForm';
import { StackForm } from './StackForm';
import { Scan } from '../components/Scan';
/** A collapsible admin form with save, load example and delete; the server validates and says what is missing. */
function Admin({ title, help, value, empty, example, save, remove, form }) {
    const { t } = useI18n();
    const [open, setOpen] = useState(!value);
    const [v, setV] = useState(() => structuredClone(value ?? empty));
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const set = (x) => { setV(x); setMsg(null); };
    async function onSave() {
        setBusy(true);
        setMsg(null);
        try {
            const r = await save(tidy(v));
            setMsg({ ok: true, text: `${t('plan.a.saved')} ${r.summary}.` });
        }
        catch (e) {
            setMsg({ ok: false, text: String(e.message ?? e).replace(/^API \d+ · /, '') });
        }
        finally {
            setBusy(false);
        }
    }
    async function onRemove() {
        if (!window.confirm(t('plan.a.removeConfirm')))
            return;
        await remove();
        set(structuredClone(empty));
    }
    return (_jsxs("section", { className: "card card-tight col g12", style: { borderStyle: 'dashed' }, "aria-label": title, children: [_jsxs("div", { className: "row g8", style: { justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("button", { type: "button", onClick: () => setOpen((o) => !o), "aria-expanded": open, className: "col", style: { border: 0, background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }, children: [_jsx("span", { className: "label", children: t('bill.a.only') }), _jsx("span", { className: "w7", children: title })] }), open
                        ? _jsx("button", { type: "button", className: "btn btn-primary btn-sm", onClick: onSave, disabled: busy, children: busy ? `${t('common.loading')}…` : msg?.ok ? `✓ ${t('set.saved').replace(/\.$/, '')}` : t('set.save') })
                        : _jsx("button", { type: "button", className: "t-sm", style: { color: 'var(--azul)', border: 0, background: 'none', cursor: 'pointer' }, onClick: () => setOpen(true), children: t('plan.a.edit') })] }), open && (_jsxs(_Fragment, { children: [_jsx(Scan, { text: help }), msg && _jsx("p", { role: "status", className: "t-sm w7", style: { margin: 0, color: msg.ok ? 'var(--success)' : 'var(--danger)' }, children: msg.text }), form(v, set), msg && !msg.ok && _jsx("p", { role: "status", className: "t-sm w7", style: { margin: 0, color: 'var(--danger)' }, children: msg.text }), _jsxs("div", { className: "row g8", style: { flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", className: "btn btn-primary btn-sm", onClick: onSave, disabled: busy, children: t('set.save') }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => set(structuredClone(example)), children: t('plan.a.example') }), value != null && _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: onRemove, children: t('plan.a.remove') }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setOpen(false), children: t('plan.a.hide') })] })] }))] }));
}
/** Admin only · What the brand contracted (connector tool braindy_plan) and its apps stack (braindy_stack), as forms.
 *  The schedule is edited in the contract panel (Onboarding), where it is Anexo 2. */
export function AdminPlan({ brandId, plan, stack }) {
    const { t } = useI18n();
    return (_jsxs("div", { className: "col g12", children: [_jsx(Admin, { title: t('plan.a.title'), help: t('plan.a.help'), value: plan, empty: EMPTY_PLAN, example: EXAMPLE, save: (v) => planApi.set(brandId, v), remove: () => planApi.remove(brandId), form: (v, set) => _jsx(PlanForm, { v: v, set: set }) }), _jsx(Admin, { title: t('plan.a.stackTitle'), help: t('plan.a.stackHelp'), value: stack, empty: [], example: EXAMPLE_STACK, save: (v) => planApi.setStack(brandId, v), remove: () => planApi.removeStack(brandId), form: (v, set) => _jsx(StackForm, { v: v, set: set }) })] }));
}
