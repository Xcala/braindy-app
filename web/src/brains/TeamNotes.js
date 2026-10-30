import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
const ORDER = ['researcher', 'marketer', 'creator', 'builder'];
/** NickMark only: what each Brain brought to the team meeting before the plan. */
export function TeamNotes({ notes }) {
    const { t } = useI18n();
    return (_jsxs("details", { className: "col g8", style: { borderTop: '1px solid var(--line)', paddingTop: 12 }, children: [_jsxs("summary", { className: "t-sm w7", style: { cursor: 'pointer' }, children: [t('team.notes'), " ", _jsxs("span", { className: "t-xs t-mute", children: ["\u00B7 ", t(notes.ai ? 'brains.proposedAi' : 'brains.proposedBasic')] })] }), _jsx("div", { className: "col g8", style: { marginTop: 10 }, children: ORDER.filter((b) => notes[b]).map((b) => (_jsxs("div", { className: "row g12", style: { alignItems: 'flex-start' }, children: [_jsx("span", { className: `brain b-${b}`, style: { width: 32, height: 32, flex: 'none' }, children: _jsx("img", { src: `/brand/brains/${b}.png`, alt: "" }) }), _jsxs("span", { className: "col", children: [_jsx("span", { className: "t-xs w7", children: brainName(b) }), _jsx("span", { className: "t-sm", children: notes[b] })] })] }, b))) })] }));
}
/** NickMark only: meetings with the client. Their notes become team memory for the four Brains. */
export function MeetingsCard({ brandId }) {
    const { t } = useI18n();
    const [list, setList] = useState([]);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'meetings'), orderBy('date', 'desc')), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([])), [brandId]);
    const base = `/v1/admin/brands/${brandId}/brains/meetings`;
    async function add(e) {
        e.preventDefault();
        setBusy(true);
        try {
            await api(base, { method: 'POST', body: JSON.stringify({ title, date, notes }) });
            setTitle('');
            setNotes('');
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("section", { className: "card col g12", style: { borderStyle: 'dashed' }, "aria-labelledby": "h-meetings", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsx("h2", { className: "h3", id: "h-meetings", children: t('team.meetings') }), _jsx("span", { className: "chip c-group", children: t('role.admin') })] }), _jsx("p", { className: "t-sm t-mute", children: t('team.meetingsSub') }), _jsxs("form", { className: "col g8", onSubmit: add, children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-[1fr_180px]", children: [_jsx("input", { className: "input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: t('team.meetingTitle'), "aria-label": t('team.meetingTitle') }), _jsx("input", { className: "input", type: "date", value: date, onChange: (e) => setDate(e.target.value), "aria-label": t('team.meetingDate') })] }), _jsx("textarea", { className: "input", rows: 5, value: notes, onChange: (e) => setNotes(e.target.value), placeholder: t('team.meetingNotesPh'), "aria-label": t('team.meetingNotes'), style: { height: 'auto', paddingTop: 10 } }), _jsx("button", { className: "btn btn-primary btn-sm self-start", disabled: busy || !notes.trim(), children: t('team.meetingAdd') })] }), list.map((m) => (_jsxs("details", { style: { borderTop: '1px solid var(--line)', paddingTop: 8 }, children: [_jsx("summary", { className: "row between g8 t-sm", style: { cursor: 'pointer' }, children: _jsxs("span", { children: [_jsx("b", { children: m.title }), " ", _jsxs("span", { className: "t-mute", children: ["\u00B7 ", m.date] })] }) }), _jsx("p", { className: "t-sm", style: { whiteSpace: 'pre-wrap', marginTop: 8 }, children: m.notes }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => api(`${base}/${m.id}`, { method: 'DELETE' }), children: t('acc.delete') })] }, m.id)))] }));
}
