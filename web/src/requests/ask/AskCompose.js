import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { dayLabel } from '../../lib/dates';
import { useTour } from '../../tour/useTour';
import { askSteps } from '../../tour/steps';
import { TAXONOMY, findCategory } from '../taxonomy';
import { AskDetails } from '../AskDetails';
import { AskAttachments } from '../AskAttachments';
import { createRequest } from '../api';
import { LessonForCategory } from '../../criterio/LessonCards';
import { VoiceNote } from './VoiceNote';
import { checklist, intentById, quickDates } from './intents';
/**
 * Second step of "New request": the words, the taps and the files. A live checklist shows the four things that make
 * a request clear; what is missing is asked as a short tap, never as a wall. "This is how NickMark read it" sums it
 * up before sending, and it can always go as it is: NickMark asks for the rest.
 */
export function AskCompose({ brandId, seed, onBack }) {
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const intent = intentById(seed.intent);
    const [text, setText] = useState(seed.text);
    const [answers, setAnswers] = useState(seed.answers);
    const [files, setFiles] = useState([]);
    const [links, setLinks] = useState(seed.links ?? []);
    const [link, setLink] = useState('');
    const [busyFiles, setBusyFiles] = useState(0);
    const [when, setWhen] = useState('');
    const [picked, setPicked] = useState('');
    const [noMaterial, setNoMaterial] = useState(false);
    const [more, setMore] = useState(false);
    const [cat, setCat] = useState(seed.category ?? intent?.category ?? '');
    const [detail, setDetail] = useState({ sub: seed.sub ?? '', type: seed.formatType ?? '', application: {}, scene: {}, format: '', language: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    useTour('ask', () => askSteps(lang), true, false);
    const q = quickDates();
    const dueDate = when === 'thisWeek' ? q.thisWeek : when === 'nextWeek' ? q.nextWeek : when === 'pick' ? picked : '';
    const check = checklist({ intent, answers, text, dueDate, noRush: when === 'noRush', files: files.length, links: links.length, noMaterial });
    const missing = Object.keys(check).filter((k) => !check[k]);
    const answered = Object.values(answers).filter((v) => v?.length).length;
    const ready = (text.trim().length > 5 || answered >= 2 || files.some((f) => f.contentType.startsWith('audio/'))) && !busyFiles;
    const withNicolas = !!findCategory(cat)?.withNicolas;
    const toggle = (k, v, multi) => setAnswers((a) => {
        const cur = a[k] ?? [];
        return { ...a, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : multi ? [...cur, v] : [v] };
    });
    const addLink = () => { const v = link.trim(); if (/^https?:\/\//i.test(v)) {
        setLinks((l) => [...l, v].slice(0, 10));
        setLink('');
    } };
    const format = answers.format?.[0] ?? detail.type ?? '';
    const firstLine = text.trim().split('\n')[0].slice(0, 80);
    const summary = [
        format || intent?.label[lang] || t('as.aRequest'),
        answers.where?.length ? t('as.sumWhere', { where: answers.where.join(', ') }) : '',
        answers.goal?.length ? t('as.sumGoal', { goal: answers.goal[0].toLowerCase() }) : '',
        dueDate ? t('as.sumDue', { day: dayLabel(dueDate, lang) }) : when === 'noRush' ? t('as.sumNoRush') : '',
    ].filter(Boolean).join(', ');
    async function submit() {
        setBusy(true);
        setError(false);
        const lines = [
            ...(intent?.questions ?? []).filter((x) => answers[x.key]?.length).map((x) => `${x.label[lang]} ${answers[x.key].join(', ')}`),
            when === 'noRush' ? t('as.sumNoRush') : '', noMaterial ? t('as.noMaterial') : '', detail.application.text ?? '',
        ].filter(Boolean);
        const title = (format && !firstLine.toLowerCase().includes(format.toLowerCase()) ? `${format} · ${firstLine || answers.goal?.[0] || ''}` : firstLine || format || summary).replace(/ · $/, '').slice(0, 90);
        try {
            const { requestId } = await createRequest(brandId, {
                category: cat, subcategory: detail.sub, formatType: format, title,
                cards: { product: { text: text.trim() || summary, links, files }, application: { ...detail.application, text: lines.join('\n') }, scene: detail.scene },
                dueDate, format: detail.format, language: detail.language,
            });
            navigate(`/requests/${requestId}`);
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "col g20", children: [_jsxs("div", { className: "row between g8", children: [_jsx("span", { className: "chip chip-plain", style: { background: '#F2F5FF', color: 'var(--azul)' }, children: intent ? intent.label[lang] : t('as.direct') }), _jsxs("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: onBack, children: [_jsx(Icon, { name: "arrowLeft", size: 16 }), t('as.change')] })] }), _jsx("textarea", { className: "input", autoFocus: true, "aria-label": t('ask.need'), "data-tour": "ask-what", style: { minHeight: 120, padding: '14px 16px', resize: 'vertical', fontSize: 16, lineHeight: 1.5 }, placeholder: intent?.ph[lang] ?? t('ask.simplePh'), value: text, onChange: (e) => setText(e.target.value) }), intent?.questions.map((x) => (_jsxs("div", { className: "col g8", role: "group", "aria-label": x.label[lang], children: [_jsxs("span", { className: "t-sm w7", children: [x.label[lang], x.multi && _jsxs("span", { className: "t-xs t-mute", children: [" \u00B7 ", t('as.several')] })] }), _jsx("div", { className: "row g8 wrap", children: x.options.map((o) => {
                            const on = !!answers[x.key]?.includes(o[lang]);
                            return (_jsxs("button", { type: "button", className: `fx-chip${on ? ' is-on' : ''}`, style: { height: 36 }, "aria-pressed": on, onClick: () => toggle(x.key, o[lang], x.multi), children: [on && _jsx(Icon, { name: "check", size: 14 }), o[lang]] }, o.es));
                        }) })] }, x.key))), _jsxs("div", { className: "col g8", role: "group", "aria-label": t('as.when'), "data-tour": "ask-when", children: [_jsx("span", { className: "t-sm w7", children: t('as.when') }), _jsxs("div", { className: "row g8 wrap", children: [['thisWeek', 'nextWeek', 'noRush', 'pick'].map((w) => (_jsx("button", { type: "button", className: `fx-chip${when === w ? ' is-on' : ''}`, style: { height: 36 }, "aria-pressed": when === w, onClick: () => setWhen(when === w ? '' : w), children: t(`as.w.${w}`, { day: dayLabel(w === 'thisWeek' ? q.thisWeek : q.nextWeek, lang) }) }, w))), when === 'pick' && _jsx("input", { type: "date", className: "input", style: { height: 36, width: 160 }, value: picked, min: new Date().toISOString().slice(0, 10), onChange: (e) => setPicked(e.target.value), "aria-label": t('ask.due') })] })] }), _jsxs("div", { className: "col g8", children: [_jsx("span", { className: "t-sm w7", children: t('as.material') }), _jsx(AskAttachments, { brandId: brandId, files: files, onChange: setFiles, onBusy: (b) => setBusyFiles((n) => n + (b ? 1 : -1)) }), _jsxs("div", { className: "row g8 wrap", children: [_jsx(VoiceNote, { brandId: brandId, onAdd: (f) => setFiles((all) => [...all, f]), onBusy: (b) => setBusyFiles((n) => n + (b ? 1 : -1)) }), _jsxs("button", { type: "button", className: `fx-chip${noMaterial ? ' is-on' : ''}`, style: { height: 36 }, "aria-pressed": noMaterial, onClick: () => setNoMaterial((v) => !v), children: [noMaterial && _jsx(Icon, { name: "check", size: 14 }), t('as.noMaterial')] })] }), links.map((l) => (_jsxs("div", { className: "row g8 t-sm", children: [_jsx(Icon, { name: "link", size: 14 }), _jsx("a", { href: l, target: "_blank", rel: "noreferrer", className: "grow truncate", children: l }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setLinks((all) => all.filter((x) => x !== l)), "aria-label": t('ask.removeLink'), children: "\u2715" })] }, l))), _jsxs("div", { className: "row g8", children: [_jsx("input", { className: "input grow", style: { height: 40 }, type: "url", placeholder: t('ask.linkPh'), "aria-label": t('ask.addLink'), value: link, onChange: (e) => setLink(e.target.value), onKeyDown: (e) => e.key === 'Enter' && (e.preventDefault(), addLink()) }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", style: { height: 40 }, disabled: !/^https?:\/\//i.test(link.trim()), onClick: addLink, children: t('ask.addLink') })] })] }), _jsxs("div", { className: "col g8", "data-tour": "ask-cards", children: [_jsx("button", { type: "button", className: "btn btn-ghost btn-sm self-start", "aria-expanded": more, onClick: () => setMore((m) => !m), children: t(more ? 'ask.hideDetail' : 'as.exactType') }), more && (_jsxs("div", { className: "col g12", children: [_jsx("div", { className: "row g8 wrap", children: TAXONOMY.map((c) => (_jsx("button", { type: "button", "aria-pressed": c.id === cat, onClick: () => { setCat(c.id); setDetail((d) => ({ ...d, sub: '', type: '' })); }, className: `btn btn-sm ${c.id === cat ? 'btn-primary' : 'btn-secondary'}`, children: c.label[lang] }, c.id))) }), _jsx(AskDetails, { cat: cat, value: detail, onChange: setDetail }), _jsx(LessonForCategory, { category: cat || undefined })] }))] }), _jsxs("div", { className: "ask-summary col g12", "data-tour": "ask-summary", children: [_jsx("ul", { className: "ask-check", "aria-label": t('as.checkLabel'), children: Object.keys(check).map((k) => _jsxs("li", { className: check[k] ? 'is-ok' : '', children: [_jsx(Icon, { name: check[k] ? 'check' : 'plus', size: 14 }), t(`as.c.${k}`)] }, k)) }), (answered > 0 || dueDate || text.trim()) && (_jsxs("div", { className: "col g4", children: [_jsx("span", { className: "label", children: t('as.understood') }), _jsxs("p", { className: "t-sm", style: { margin: 0 }, children: [_jsxs("strong", { children: [summary, "."] }), firstLine && _jsxs("span", { className: "t-mute", children: [" \u00AB", firstLine, "\u00BB"] })] })] })), _jsx("span", { className: "t-xs t-mute", children: withNicolas ? t('ask.levelNicolas') : t('ask.levelSelf') })] }), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)', margin: 0 }, children: t('ask.error') }), _jsxs("div", { className: "row between g12 wrap", children: [_jsx("span", { className: "t-xs t-mute", style: { maxWidth: 300 }, children: missing.length ? t('as.missingNote', { what: missing.map((k) => t(`as.c.${k}`).toLowerCase()).join(', ') }) : t('as.allClear') }), _jsx("button", { type: "button", className: "btn btn-primary", disabled: !ready || busy, onClick: submit, children: busyFiles ? t('ask.uploading') : t(missing.length ? 'as.sendAnyway' : 'ask.sendSimple') })] })] }));
}
