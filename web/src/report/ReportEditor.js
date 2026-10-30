import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { saveReport } from './useReports';
import { brainsApi } from '../brains/useBrains';
const thisMonth = () => new Date().toISOString().slice(0, 7);
/** Admin: fill in the numbers that come from outside (CRM, ads) and the Brains' lines, then publish. */
export function ReportEditor({ brandId, existing }) {
    const { t } = useI18n();
    const [month, setMonth] = useState(existing[0]?.month ?? thisMonth());
    const base = existing.find((r) => r.month === month);
    const [f, setF] = useState({});
    const [leads, setLeads] = useState('');
    const [msg, setMsg] = useState(null);
    useEffect(() => {
        setF(base ?? {});
        setLeads((base?.leadsByMonth ?? []).map((x) => `${x.month}=${x.n}`).join(', '));
    }, [month, base?.id]); // eslint-disable-line react-hooks/exhaustive-deps
    const n = (k) => (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: `r-${k}`, children: t(`rep.f.${k}`) }), _jsx("input", { id: `r-${k}`, className: "input", inputMode: "decimal", value: f[k] ?? '', onChange: (e) => setF({ ...f, [k]: e.target.value }) })] }));
    async function save(published) {
        setMsg(null);
        const leadsByMonth = leads.split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [m, v] = s.split('='); return { month: m.trim(), n: Number(v) || 0 }; });
        try {
            const r = await saveReport(brandId, month, { ...f, leadsByMonth, published });
            setMsg(t('rep.savedCount', { n: r.pieces }));
        }
        catch {
            setMsg(t('rep.saveError'));
        }
    }
    return (_jsxs("section", { className: "card col g16", style: { borderStyle: 'dashed' }, "aria-labelledby": "rep-edit", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsx("h2", { className: "h3", id: "rep-edit", children: t('rep.editTitle') }), _jsx("span", { className: "chip c-group", children: t('role.admin') })] }), _jsxs("div", { className: "field", style: { maxWidth: 220 }, children: [_jsx("label", { htmlFor: "r-month", children: t('rep.month') }), _jsx("input", { id: "r-month", className: "input", type: "month", value: month, onChange: (e) => setMonth(e.target.value) })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [n('salesAttributed'), n('salesPrev'), n('leads'), n('costPerLead')] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "r-lbm", children: t('rep.f.leadsByMonth') }), _jsx("input", { id: "r-lbm", className: "input", value: leads, onChange: (e) => setLeads(e.target.value), placeholder: "2026-07=12, 2026-08=18" })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "r-moved", children: t('rep.f.whatMoved') }), _jsx("textarea", { id: "r-moved", className: "input", rows: 2, value: f.whatMoved ?? '', onChange: (e) => setF({ ...f, whatMoved: e.target.value }), style: { height: 'auto', paddingTop: 10 } })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "r-next", children: t('rep.f.nextMonth') }), _jsx("textarea", { id: "r-next", className: "input", rows: 3, value: f.nextMonth ?? '', onChange: (e) => setF({ ...f, nextMonth: e.target.value }), style: { height: 'auto', paddingTop: 10 } })] }), _jsx("p", { className: "help", children: t('rep.countedHelp') }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("button", { className: "btn btn-ghost", onClick: async () => { setMsg(t('brains.drafting')); try {
                            await brainsApi.draftReport(brandId, month);
                            setMsg(t('brains.drafted'));
                        }
                        catch {
                            setMsg(t('brains.error'));
                        } }, children: t('brains.askMarketer') }), _jsx("button", { className: "btn btn-secondary", onClick: () => save(false), children: t('rep.saveDraft') }), _jsx("button", { className: "btn btn-primary", onClick: () => save(true), children: t('rep.publish') }), msg && _jsx("span", { className: "t-sm", role: "status", children: msg })] })] }));
}
