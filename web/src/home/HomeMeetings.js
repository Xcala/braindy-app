import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { dayLabel } from '../lib/dates';
import { MeetingNotes, topics } from './MeetingNotes';
const SHOW = 5;
/**
 * Home: the meeting history with this client and its notes, fed by its Granola folder (manual notes as a fallback).
 * The client reads it through the API, without the meetings Nicolas hid; the admin reads it live and can hide, pull or delete.
 */
export function HomeMeetings({ brandId, admin }) {
    const { t, lang } = useI18n();
    const [list, setList] = useState([]);
    const [all, setAll] = useState(false);
    const [pull, setPull] = useState('idle');
    useEffect(() => {
        if (!admin) {
            let on = true;
            api(`/v1/brands/${brandId}/meetings`).then((r) => on && setList(r.items)).catch(() => on && setList([]));
            return () => { on = false; };
        }
        return onSnapshot(query(collection(db, 'brands', brandId, 'meetings'), orderBy('date', 'desc')), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setList([]));
    }, [brandId, admin]);
    // Opening the Home (as admin) pulls new notes from the Granola folders (the server throttles it to every 10 minutes).
    useEffect(() => { if (admin)
        api('/v1/admin/granola/folders', { method: 'POST', body: '{}' }).catch(() => { }); }, [brandId, admin]);
    async function bring() {
        setPull('busy');
        try {
            setPull(await api('/v1/admin/granola/folders?force=1', { method: 'POST', body: '{}' }));
        }
        catch (e) {
            setPull({ error: e.message });
        }
    }
    const shown = all ? list : list.slice(0, SHOW);
    return (_jsxs("section", { className: "col g12", "aria-labelledby": "h-meetings", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsx("h2", { className: "h3", id: "h-meetings", children: t(admin ? 'team.meetings' : 'hg.history') }), admin && _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", disabled: pull === 'busy', onClick: bring, children: pull === 'busy' ? t('mt.pulling') : t('mt.pull') })] }), _jsx("p", { className: "t-sm t-mute", children: t(admin ? 'mt.sub' : 'mt.subClient') }), typeof pull === 'object' && (_jsxs("p", { className: "t-xs", role: "status", style: { color: pull.error ? 'var(--danger)' : 'var(--success)' }, children: [pull.error ?? t('mt.pulled', { filed: String(pull.filed ?? 0) }), !!pull.unmatched?.length && _jsxs("span", { className: "t-mute", children: [" \u00B7 ", t('mt.unmatched', { list: pull.unmatched.join(', ') })] })] })), list.length === 0 && _jsx("div", { className: "card t-mute", children: t(admin ? 'mt.empty' : 'hg.noHistory') }), shown.map((m) => {
                const d = new Date(`${m.date.slice(0, 10)}T12:00:00`);
                const tps = topics(m.notes);
                return (_jsxs("details", { className: "card mcard", style: m.hidden ? { opacity: 0.6 } : undefined, children: [_jsxs("summary", { className: "mcard-s", children: [_jsxs("span", { className: "mdate", "aria-hidden": "true", children: [_jsx("b", { children: d.getDate() }), _jsx("span", { children: d.toLocaleDateString(lang, { month: 'short' }).replace('.', '') })] }), _jsxs("span", { className: "col g4 grow", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 truncate", children: m.title }), _jsxs("span", { className: "t-xs t-mute", children: [dayLabel(m.date, lang), (m.attendees?.length ?? m.people) ? ` · ${t('mt.people', { n: String(m.attendees?.length ?? m.people) })}` : '', admin && m.source === 'granola' ? ' · Granola' : '', m.hidden ? ` · ${t('mt.hidden')}` : ''] }), tps.length > 0 && _jsxs("span", { className: "mtags", children: [tps.slice(0, 3).map((x) => _jsx("span", { children: x }, x)), tps.length > 3 && _jsxs("span", { children: ["+", tps.length - 3] })] })] }), _jsx("span", { className: "mchev", "aria-hidden": "true" })] }), _jsxs("div", { className: "mcard-b", children: [_jsx(MeetingNotes, { notes: m.notes }), admin && _jsxs("div", { className: "row g8 wrap", children: [_jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => api(`/v1/admin/brands/${brandId}/brains/meetings/${m.id}`, { method: 'PATCH', body: JSON.stringify({ hidden: !m.hidden }) }), children: t(m.hidden ? 'mt.show' : 'mt.hide') }), m.webUrl && _jsxs("a", { href: m.webUrl, target: "_blank", rel: "noreferrer", className: "btn btn-ghost btn-sm", style: { textDecoration: 'none' }, children: [t('mt.open'), " \u2197"] }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => api(`/v1/admin/brands/${brandId}/brains/meetings/${m.id}`, { method: 'DELETE' }), children: t('acc.delete') })] })] })] }, m.id));
            }), !all && list.length > SHOW && _jsx("button", { type: "button", className: "btn btn-ghost btn-sm self-start", onClick: () => setAll(true), children: t('mt.more', { n: String(list.length - SHOW) }) }), admin && _jsx(ManualMeeting, { brandId: brandId })] }));
}
function ManualMeeting({ brandId }) {
    const { t } = useI18n();
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    async function add(e) {
        e.preventDefault();
        setBusy(true);
        try {
            await api(`/v1/admin/brands/${brandId}/brains/meetings`, { method: 'POST', body: JSON.stringify({ title, date, notes }) });
            setTitle('');
            setNotes('');
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("details", { children: [_jsxs("summary", { className: "t-sm w7", style: { cursor: 'pointer' }, children: ["+ ", t('mt.manual')] }), _jsxs("form", { className: "col g8", style: { marginTop: 10 }, onSubmit: add, children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-[1fr_180px]", children: [_jsx("input", { className: "input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: t('team.meetingTitle'), "aria-label": t('team.meetingTitle') }), _jsx("input", { className: "input", type: "date", value: date, onChange: (e) => setDate(e.target.value), "aria-label": t('team.meetingDate') })] }), _jsx("textarea", { className: "input", rows: 5, value: notes, onChange: (e) => setNotes(e.target.value), placeholder: t('team.meetingNotesPh'), "aria-label": t('team.meetingNotes'), style: { height: 'auto', paddingTop: 10 } }), _jsx("button", { className: "btn btn-primary btn-sm self-start", disabled: busy || !notes.trim(), children: t('team.meetingAdd') })] })] }));
}
