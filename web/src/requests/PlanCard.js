import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { TeamNotes } from '../brains/TeamNotes';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { BrainStack, brainName } from '../components/BrainStack';
import { savePlan } from './api';
import { dayLabel } from '../lib/dates';
/** The plan gate: Nicolas edits and approves the scope; the client sees it once approved. */
export function PlanCard({ brandId, r, isAdmin }) {
    const { t, lang } = useI18n();
    // Older or hand-written plans may store the scope as one text: always work with a list.
    const planScope = Array.isArray(r.plan?.scope) ? r.plan.scope : r.plan?.scope ? [String(r.plan.scope)] : [];
    const defaults = [t('req.scope.researcher'), t(`req.scope.lead.${r.leadBrain}`), t('req.scope.builder')];
    const [scope, setScope] = useState(planScope.length ? planScope : defaults);
    const [firstDelivery, setFirstDelivery] = useState(r.plan?.firstDelivery ?? '');
    const [note, setNote] = useState(r.plan?.note ?? '');
    const [busy, setBusy] = useState(false);
    // A new proposal from the Brain (or after "Ask again") refreshes the editable fields.
    useEffect(() => {
        if (r.plan && !r.plan.approved) {
            setScope(planScope.length ? planScope : defaults);
            setFirstDelivery(r.plan.firstDelivery ?? '');
            setNote(r.plan.note ?? '');
        }
    }, [planScope.join('|'), r.plan?.firstDelivery, r.plan?.note]); // eslint-disable-line react-hooks/exhaustive-deps
    const repropose = async () => { setBusy(true); try {
        await api(`/v1/admin/brands/${brandId}/brains/plan/${r.id}`, { method: 'POST', body: '{}' });
    }
    finally {
        setBusy(false);
    } };
    const approved = !!r.plan?.approved;
    if (!isAdmin && !approved) {
        return (_jsxs("div", { className: "card col g12", children: [_jsx(BrainStack, { lead: r.leadBrain, state: "working", label: t('req.planPreparing', { brain: brainName(r.leadBrain) }) }), _jsx("p", { className: "t-sm t-mute", children: r.approvalLevel === 'nicolas' ? t('req.planWithNicolas') : t('req.planSoon') })] }));
    }
    const save = async (approve) => {
        setBusy(true);
        try {
            await savePlan(brandId, r.id, { scope: scope.filter((s) => s.trim()), firstDelivery, note, approve });
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("div", { className: "card col g20", children: [_jsxs("div", { className: "row between g12 wrap", children: [_jsx(BrainStack, { lead: r.leadBrain, state: approved ? 'idle' : 'approval', label: t('req.planBy', { brain: brainName(r.leadBrain) }) }), _jsxs("span", { className: "row g8", children: [r.plan?.proposedBy && !approved && _jsx("span", { className: "chip chip-plain", children: r.plan.proposedWithAi ? t('brains.proposedAi') : t('brains.proposedBasic') }), _jsx("span", { className: `chip ${approved ? 'c-approved' : 'c-approve'}`, children: approved ? t('req.planApproved') : t('req.planToApprove') })] })] }), isAdmin && !approved && r.plan?.note && _jsx("p", { className: "t-sm", style: { padding: '10px 14px', borderRadius: 12, background: 'var(--hielo)' }, children: r.plan.note }), _jsxs("div", { className: "col g12", children: [_jsx("p", { className: "label", children: t('req.scope') }), scope.map((s, i) => (_jsxs("div", { className: "rule", children: [_jsx("span", { className: "ok", children: _jsx(Icon, { name: "check", size: 14 }) }), isAdmin && !approved
                                ? _jsx("input", { className: "input", style: { height: 38 }, value: s, "aria-label": `${t('req.scope')} ${i + 1}`, onChange: (e) => setScope((l) => l.map((x, j) => (j === i ? e.target.value : x))) })
                                : _jsx("span", { children: s })] }, i))), isAdmin && !approved && _jsxs("button", { className: "btn btn-ghost btn-sm self-start", onClick: () => setScope((l) => [...l, '']), children: ["+ ", t('req.addScope')] }), _jsxs("div", { className: "row g24 wrap t-sm", children: [_jsxs("span", { children: [_jsx("span", { className: "t-mute", children: t('req.firstDelivery') }), ' ', isAdmin && !approved ? _jsx("input", { className: "input inline-block", style: { height: 34, width: 170 }, type: "date", value: firstDelivery, onChange: (e) => setFirstDelivery(e.target.value), "aria-label": t('req.firstDelivery') }) : _jsx("strong", { children: r.plan?.firstDelivery ? dayLabel(r.plan.firstDelivery, lang) : '—' })] }), _jsxs("span", { children: [_jsx("span", { className: "t-mute", children: t('req.approval') }), " ", _jsx("strong", { children: r.approvalLevel === 'nicolas' ? t('req.approvalNicolas') : t('req.approvalClient') })] })] })] }), isAdmin && !approved && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "note", children: t('req.noteForBrains') }), _jsx("input", { className: "input", id: "note", value: note, onChange: (e) => setNote(e.target.value), placeholder: t('req.notePh') })] }), _jsxs("div", { className: "row g12 wrap", children: [_jsxs("button", { className: "btn btn-primary", disabled: busy, onClick: () => save(true), children: [_jsx(Icon, { name: "check" }), t('req.approvePlan')] }), _jsx("button", { className: "btn btn-secondary", disabled: busy, onClick: () => save(false), children: t('req.saveDraft') }), _jsx("button", { className: "btn btn-ghost", disabled: busy, onClick: repropose, children: t('brains.askAgain', { brain: brainName(r.leadBrain) }) }), _jsx("span", { className: "t-sm t-mute", children: t('req.clientSeesPlan') })] })] })), approved && r.plan?.note && _jsx("p", { className: "t-sm t-mute", children: r.plan.note }), isAdmin && r.teamNotes && _jsx(TeamNotes, { notes: r.teamNotes })] }));
}
