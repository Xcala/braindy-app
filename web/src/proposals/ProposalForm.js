import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
/** Proposal content: every field saves on blur (Firestore field path → value). */
export function ProposalForm({ p }) {
    const { t } = useI18n();
    const [saved, setSaved] = useState(false);
    const save = async (path, value) => {
        await updateDoc(doc(db, 'proposals', p.id), { [path]: value });
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
    };
    return (_jsxs("section", { className: "card col g20", "aria-labelledby": "pcontent", children: [_jsxs("div", { className: "row between", children: [_jsx("h2", { className: "h3", id: "pcontent", children: t('proposals.content') }), _jsx("span", { className: "t-sm", role: "status", style: { color: 'var(--success)', opacity: saved ? 1 : 0 }, children: t('proposals.saved') })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Field, { label: t('proposals.f.title'), value: p.title, onSave: (v) => save('title', v) }), _jsx(Field, { label: t('proposals.f.company'), value: p.prospect?.company, onSave: (v) => save('prospect.company', v) }), _jsx(Field, { label: t('proposals.f.contact'), value: p.prospect?.name, onSave: (v) => save('prospect.name', v) }), _jsx(Field, { label: t('proposals.f.email'), type: "email", value: p.prospect?.email, onSave: (v) => save('prospect.email', v) }), _jsx(Field, { label: t('proposals.f.phone'), type: "tel", value: p.prospect?.phone, onSave: (v) => save('prospect.phone', v) }), _jsx(Field, { label: t('proposals.f.validUntil'), type: "date", value: p.validUntil, onSave: (v) => save('validUntil', v) }), _jsx(Select, { label: t('proposals.f.lang'), value: p.lang, options: [['en', 'English'], ['es', 'Español']], onSave: (v) => save('lang', v) }), _jsx(Select, { label: t('proposals.f.recommended'), value: p.recommended ?? 'transform', options: ['launch', 'transform', 'continuity'].map((k) => [k, t(`proposals.opt.${k}`)]), onSave: (v) => save('recommended', v) })] }), _jsxs(Group, { title: t('proposals.fromAtoB'), children: [_jsx(Field, { area: true, label: t('proposals.f.today'), value: p.fromA?.today, onSave: (v) => save('fromA.today', v) }), _jsx(Field, { area: true, label: t('proposals.f.target'), value: p.toB?.target, onSave: (v) => save('toB.target', v) }), _jsx(Field, { area: true, label: t('proposals.f.insights'), value: p.fromA?.insights, onSave: (v) => save('fromA.insights', v) }), _jsx(Field, { area: true, label: t('proposals.f.changes'), value: p.toB?.changes, onSave: (v) => save('toB.changes', v) })] }), _jsx(Group, { title: t('proposals.prices'), children: ['launch', 'transform', 'continuity', 'aiAgents'].map((k) => (_jsx(Field, { label: t(`proposals.opt.${k}`), placeholder: t('proposals.pricePh'), value: p.options?.[k]?.price, onSave: (v) => save(`options.${k}.price`, v) }, k))) }), _jsxs(Group, { title: t('proposals.amounts'), children: [_jsx(Select, { label: t('bill.a.currency'), value: p.currency ?? 'usd', options: [['usd', 'USD'], ['cop', 'COP']], onSave: (v) => save('currency', v) }), _jsx("p", { className: "t-xs t-mute", style: { alignSelf: 'end' }, children: t('proposals.amountsHint') }), [['launch', 'amount'], ['transform', 'amount'], ['transform', 'monthly'], ['continuity', 'monthly']].map(([k, f]) => (_jsx(Field, { type: "number", label: `${t(`proposals.opt.${k}`)} · ${t(f === 'amount' ? 'bill.a.project' : 'bill.a.monthly')}`, value: p.options?.[k]?.[f] != null ? String(p.options[k][f]) : '', onSave: (v) => save(`options.${k}.${f}`, v.trim() ? Number(v) : null) }, `${k}-${f}`)))] }), _jsx(Field, { area: true, label: t('proposals.f.notes'), value: p.notes, onSave: (v) => save('notes', v) })] }));
}
function Group({ title, children }) {
    return _jsxs("div", { className: "col g12", children: [_jsx("p", { className: "label", children: title }), _jsx("div", { className: "grid gap-4 md:grid-cols-2", children: children })] });
}
function Field({ label, value, onSave, type = 'text', area, placeholder }) {
    const [v, setV] = useState(value ?? '');
    const id = `f-${label.replace(/\W+/g, '-')}`;
    const commit = () => { if (v !== (value ?? ''))
        onSave(v); };
    return (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: id, children: label }), area
                ? _jsx("textarea", { id: id, className: "input", style: { height: 96, padding: '12px 16px', resize: 'vertical' }, value: v, placeholder: placeholder, onChange: (e) => setV(e.target.value), onBlur: commit })
                : _jsx("input", { id: id, className: "input", type: type, value: v, placeholder: placeholder, onChange: (e) => setV(e.target.value), onBlur: commit })] }));
}
function Select({ label, value, options, onSave }) {
    const id = `s-${label.replace(/\W+/g, '-')}`;
    return (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: id, children: label }), _jsx("select", { id: id, className: "input", value: value, onChange: (e) => onSave(e.target.value), children: options.map(([k, l]) => _jsx("option", { value: k, children: l }, k)) })] }));
}
