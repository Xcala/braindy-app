import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useBrands } from '../../brands/BrandProvider';
import { useProposal } from '../../proposals/useProposals';
import { ProposalForm } from '../../proposals/ProposalForm';
import { ProposalFiles } from '../../proposals/ProposalFiles';
import { SendPanel } from '../../proposals/SendPanel';
import { Tracking } from '../../proposals/Tracking';
import { convertToBrand } from '../../proposals/api';
import { STATUS_CHIP } from '../../proposals/types';
export function ProposalDetail() {
    const { id = '' } = useParams();
    const p = useProposal(id);
    const { t } = useI18n();
    const { select } = useBrands();
    const [dialog, setDialog] = useState(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    if (p === undefined)
        return _jsxs("p", { className: "t-mute", children: [t('common.loading'), "\u2026"] });
    if (p === null)
        return _jsx("p", { className: "t-mute", children: t('proposals.notFound') });
    async function markLost() {
        setBusy(true);
        try {
            await updateDoc(doc(db, 'proposals', id), { status: 'lost', lostReason: reason, lastActivity: { type: 'lost', at: serverTimestamp() } });
            setDialog(null);
        }
        finally {
            setBusy(false);
        }
    }
    async function convert() {
        setBusy(true);
        try {
            const { brandId } = await convertToBrand(id);
            select(brandId);
            setDialog(null);
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "col", style: { gap: 28 }, children: [_jsxs("nav", { className: "crumbs", "aria-label": "Breadcrumb", children: [_jsx(Link, { to: "/admin/proposals", children: t('proposals.title') }), _jsx(Icon, { name: "chevronRight", size: 14 }), _jsx("span", { className: "cur", children: p.prospect?.company || p.title })] }), _jsxs("div", { className: "flex flex-wrap items-end justify-between gap-6", children: [_jsxs("div", { className: "col g12", children: [_jsxs("div", { className: "row g12", children: [_jsx("span", { className: `chip ${STATUS_CHIP[p.status]}`, children: t(`proposals.status.${p.status}`) }), _jsx("span", { className: "t-sm t-mute", children: p.lang === 'es' ? 'Español' : 'English' })] }), _jsxs("h1", { className: "h1", children: [p.prospect?.company && _jsxs(_Fragment, { children: [p.prospect.company, " "] }), _jsx("span", { className: p.prospect?.company ? 'w3' : 'w9', children: p.title })] }), p.acceptance && _jsxs("p", { className: "t-sm", style: { color: 'var(--success)' }, children: [t('proposals.acceptedBy', { name: p.acceptance.name }), p.acceptance.role ? ` · ${p.acceptance.role}` : ''] }), p.status === 'lost' && p.lostReason && _jsxs("p", { className: "t-sm t-mute", children: [t('proposals.reason'), ": ", p.lostReason] })] }), _jsx("div", { className: "row g12 wrap flex-none", children: p.convertedBrandId ? (_jsx(Link, { className: "btn btn-secondary", to: "/brand", onClick: () => select(p.convertedBrandId), children: t('proposals.openClient') })) : (_jsxs(_Fragment, { children: [p.status !== 'lost' && _jsx("button", { className: "btn btn-secondary", onClick: () => setDialog('lost'), children: t('proposals.markLost') }), _jsxs("button", { className: "btn btn-primary", onClick: () => setDialog('won'), children: [_jsx(Icon, { name: "check" }), t('proposals.wonCreate')] })] })) })] }), _jsxs("div", { className: "grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_440px]", children: [_jsxs("div", { className: "col g24", children: [_jsx(ProposalForm, { p: p }, p.id), _jsx(ProposalFiles, { id: p.id }), _jsx(Tracking, { id: p.id })] }), _jsx(SendPanel, { p: p }, `${p.id}-${p.prospect?.phone ?? ''}`)] }), dialog === 'lost' && (_jsx(ConfirmDialog, { title: t('proposals.markLostTitle'), confirmLabel: t('proposals.markLost'), danger: true, busy: busy, onConfirm: markLost, onCancel: () => setDialog(null), children: _jsxs("div", { className: "field", style: { marginTop: 8 }, children: [_jsx("label", { htmlFor: "reason", children: t('proposals.reason') }), _jsx("input", { id: "reason", className: "input", value: reason, onChange: (e) => setReason(e.target.value), placeholder: t('proposals.reasonPh') })] }) })), dialog === 'won' && (_jsx(ConfirmDialog, { title: t('proposals.wonTitle', { name: p.prospect?.company || p.prospect?.name || p.title }), confirmLabel: t('proposals.createClient'), busy: busy, onConfirm: convert, onCancel: () => setDialog(null), children: t('proposals.wonBody') }))] }));
}
