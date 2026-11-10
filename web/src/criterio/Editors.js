import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { TAXONOMY } from '../requests/taxonomy';
import { AREAS } from './useCriterio';
const STAGES = ['onboarding', 'ask', 'review', 'report'];
/** Spanish and English side by side for one text field. */
function Bi({ label, value, onChange, rows = 1 }) {
    return (_jsxs("div", { className: "col g8", children: [_jsx("span", { className: "t-sm w7", children: label }), _jsx("div", { className: "grid gap-3 md:grid-cols-2", children: ['es', 'en'].map((k) => (rows > 1
                    ? _jsx("textarea", { className: "input", style: { height: rows * 24 + 24, padding: '10px 14px', resize: 'vertical' }, "aria-label": `${label} ${k}`, placeholder: k.toUpperCase(), value: value[k], onChange: (e) => onChange({ ...value, [k]: e.target.value }) }, k)
                    : _jsx("input", { className: "input", "aria-label": `${label} ${k}`, placeholder: k.toUpperCase(), value: value[k], onChange: (e) => onChange({ ...value, [k]: e.target.value }) }, k))) })] }));
}
const empty = { es: '', en: '' };
/** Firestore rejects undefined values: drop them (and the id, which is the document name). */
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([k, v]) => v !== undefined && k !== 'id' && k !== 'updatedAt'));
export function LessonEditor({ l, onClose }) {
    const { t } = useI18n();
    const toast = useToast();
    const [f, setF] = useState(l ?? { area: 'logos', order: 99, status: 'draft', minutes: 3, title: empty, summary: empty, body: empty, script: empty, categories: [], stages: ['review'] });
    const set = (p) => setF((x) => ({ ...x, ...p }));
    const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    async function save(status = f.status) {
        const id = l?.id ?? (f.title.en || f.title.es).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
        if (!id)
            return;
        await setDoc(doc(db, 'lessons', id), { ...clean({ ...f, status }), updatedAt: serverTimestamp() });
        toast({ text: t('cra.saved') });
        onClose();
    }
    return (_jsxs("div", { className: "card col g16", children: [_jsxs("div", { className: "grid gap-3 md:grid-cols-3", children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "ar", children: t('cra.f.area') }), _jsx("select", { id: "ar", className: "input", value: f.area, onChange: (e) => set({ area: e.target.value }), children: AREAS.map((a) => _jsx("option", { value: a, children: t(`cr.area.${a}`) }, a)) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "mi", children: t('cra.f.minutes') }), _jsx("input", { id: "mi", type: "number", min: 1, className: "input", value: f.minutes, onChange: (e) => set({ minutes: Number(e.target.value) || 1 }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "or", children: "#" }), _jsx("input", { id: "or", type: "number", className: "input", value: f.order, onChange: (e) => set({ order: Number(e.target.value) || 0 }) })] })] }), _jsx(Bi, { label: t('cra.f.title'), value: f.title, onChange: (v) => set({ title: v }) }), _jsx(Bi, { label: t('cra.f.summary'), value: f.summary, onChange: (v) => set({ summary: v }), rows: 2 }), _jsx(Bi, { label: t('cra.f.body'), value: f.body, onChange: (v) => set({ body: v }), rows: 12 }), _jsx(Bi, { label: t('cra.f.script'), value: f.script ?? empty, onChange: (v) => set({ script: v }), rows: 6 }), _jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "vu", children: t('cra.f.video') }), _jsx("input", { id: "vu", className: "input", value: f.videoUrl ?? '', onChange: (e) => set({ videoUrl: e.target.value.trim() }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "du", children: t('cra.f.deck') }), _jsx("input", { id: "du", className: "input", value: f.deckUrl ?? '', onChange: (e) => set({ deckUrl: e.target.value.trim() }) })] })] }), _jsxs("div", { className: "col g8", children: [_jsx("span", { className: "t-sm w7", children: t('cra.f.categories') }), _jsx("div", { className: "row g8 wrap", children: TAXONOMY.map((c) => _jsx("button", { className: `btn btn-sm ${f.categories.includes(c.id) ? 'btn-primary' : 'btn-secondary'}`, "aria-pressed": f.categories.includes(c.id), onClick: () => set({ categories: toggle(f.categories, c.id) }), children: c.label.es }, c.id)) })] }), _jsxs("div", { className: "col g8", children: [_jsx("span", { className: "t-sm w7", children: t('cra.f.stages') }), _jsx("div", { className: "row g8 wrap", children: STAGES.map((s) => _jsx("button", { className: `btn btn-sm ${f.stages.includes(s) ? 'btn-primary' : 'btn-secondary'}`, "aria-pressed": f.stages.includes(s), onClick: () => set({ stages: toggle(f.stages, s) }), children: t(`cra.stage.${s}`) }, s)) })] }), _jsxs("div", { className: "row g8 wrap", children: [_jsx("button", { className: "btn btn-primary", onClick: () => save('published'), children: t('cra.publish') }), _jsx("button", { className: "btn btn-secondary", onClick: () => save(l?.status === 'published' ? 'published' : 'draft'), children: t('cra.save') }), l?.status === 'published' && _jsx("button", { className: "btn btn-ghost", onClick: () => save('draft'), children: t('cra.unpublish') }), _jsx("button", { className: "btn btn-ghost", onClick: onClose, children: t('cra.cancel') })] })] }));
}
export function ObjectionEditor({ o, lessons, onClose }) {
    const { t, lang } = useI18n();
    const toast = useToast();
    const [f, setF] = useState(o ?? { area: 'logos', order: 99, status: 'draft', phrase: empty, answer: empty, triggers: [] });
    const [triggers, setTriggers] = useState((o?.triggers ?? []).join(', '));
    const set = (p) => setF((x) => ({ ...x, ...p }));
    async function save(status = f.status) {
        const id = o?.id ?? (f.phrase.en || f.phrase.es).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
        if (!id)
            return;
        const data = { ...f, status, triggers: triggers.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) };
        await setDoc(doc(db, 'objections', id), { ...clean(data), updatedAt: serverTimestamp() });
        toast({ text: t('cra.saved') });
        onClose();
    }
    return (_jsxs("div", { className: "card col g16", children: [_jsx(Bi, { label: t('cra.f.phrase'), value: f.phrase, onChange: (v) => set({ phrase: v }) }), _jsx(Bi, { label: t('cra.f.answer'), value: f.answer, onChange: (v) => set({ answer: v }), rows: 4 }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "tr", children: t('cra.f.triggers') }), _jsx("input", { id: "tr", className: "input", value: triggers, onChange: (e) => setTriggers(e.target.value) })] }), _jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "ol", children: t('cra.f.lesson') }), _jsxs("select", { id: "ol", className: "input", value: f.lessonId ?? '', onChange: (e) => set({ lessonId: e.target.value || undefined }), children: [_jsx("option", { value: "", children: "\u2014" }), lessons.map((l) => _jsx("option", { value: l.id, children: l.title[lang] }, l.id))] })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "oa", children: t('cra.f.area') }), _jsx("select", { id: "oa", className: "input", value: f.area, onChange: (e) => set({ area: e.target.value }), children: AREAS.map((a) => _jsx("option", { value: a, children: t(`cr.area.${a}`) }, a)) })] })] }), _jsxs("div", { className: "row g8 wrap", children: [_jsx("button", { className: "btn btn-primary", onClick: () => save('published'), children: t('cra.publish') }), _jsx("button", { className: "btn btn-secondary", onClick: () => save(o?.status === 'published' ? 'published' : 'draft'), children: t('cra.save') }), o?.status === 'published' && _jsx("button", { className: "btn btn-ghost", onClick: () => save('draft'), children: t('cra.unpublish') }), _jsx("button", { className: "btn btn-ghost", onClick: onClose, children: t('cra.cancel') })] })] }));
}
