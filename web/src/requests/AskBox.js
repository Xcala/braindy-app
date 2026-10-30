import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTour } from '../tour/useTour';
import { askSteps } from '../tour/steps';
import { useI18n } from '../i18n/I18nProvider';
import { TAXONOMY, findCategory } from './taxonomy';
import { AskDetails } from './AskDetails';
import { AskAttachments } from './AskAttachments';
import { ASK_EXAMPLES, exampleFor } from './askExamples';
import { createRequest } from './api';
import { LessonForCategory } from '../criterio/LessonCards';
/**
 * "Do you need something?": the ask box in My requests. One message like WhatsApp, files by drag and drop,
 * examples of a complete ask; links, date, type of piece and details open only if wanted.
 */
export function AskBox({ brandId }) {
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [links, setLinks] = useState([]);
    const [link, setLink] = useState('');
    const [cat, setCat] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [more, setMore] = useState(false);
    const [open, setOpen] = useState(false);
    const [example, setExample] = useState(null);
    const [detail, setDetail] = useState({ sub: '', type: '', application: {}, scene: {}, format: '', language: lang === 'es' ? 'Español' : 'English' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    useTour('ask', () => askSteps(lang), true, false);
    const category = findCategory(cat);
    const withNicolas = !!category?.withNicolas || !!category?.subs.find((s) => s.id === detail.sub)?.withNicolas;
    const ready = text.trim().length > 5 && !uploading;
    const addLink = () => {
        const v = link.trim();
        if (!/^https?:\/\//i.test(v))
            return;
        setLinks((l) => [...l, v].slice(0, 10));
        setLink('');
    };
    const useExample = (e) => { setText(e.text[lang]); setCat(e.category); setExample(null); };
    async function submit() {
        setBusy(true);
        setError(false);
        const product = { text, links, files };
        const firstLine = text.trim().split('\n')[0].slice(0, 80);
        try {
            const { requestId } = await createRequest(brandId, {
                category: cat, subcategory: detail.sub, formatType: detail.type, title: detail.type || firstLine,
                cards: { product, application: detail.application, scene: detail.scene }, dueDate, format: detail.format, language: detail.language,
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
    return (_jsxs("section", { id: "ask", className: "card col g16", "aria-labelledby": "h-ask", "data-tour": "ask-what", children: [_jsxs("div", { className: "row g12", children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-11 w-11 flex-none rounded-full object-cover" }), _jsxs("span", { className: "col", children: [_jsx("h2", { className: "h3", id: "h-ask", children: t('ask.need') }), _jsx("span", { className: "t-xs t-mute", children: withNicolas ? t('ask.levelNicolas') : t('ask.levelSelf') })] })] }), _jsx("textarea", { className: "input", "aria-label": t('ask.need'), style: { minHeight: 130, padding: '14px 16px', resize: 'vertical', fontSize: 16, lineHeight: 1.5 }, placeholder: exampleFor(cat)?.text[lang] ?? t('ask.simplePh'), value: text, onChange: (e) => setText(e.target.value) }), _jsxs("div", { className: "row g8 wrap", role: "group", "aria-label": t('ask.examples'), children: [_jsx("span", { className: "t-xs t-mute", children: t('ask.examples') }), ASK_EXAMPLES.map((e) => (_jsx("button", { type: "button", className: `btn btn-sm ${example?.id === e.id ? 'btn-primary' : 'btn-secondary'}`, style: { height: 30 }, "aria-pressed": example?.id === e.id, onClick: () => setExample(example?.id === e.id ? null : e), children: e.label[lang] }, e.id)))] }), example && (_jsxs("div", { className: "col g8", style: { background: '#F4F7FF', border: '1px solid #DCE4FF', borderRadius: 12, padding: '12px 14px' }, children: [_jsx("span", { className: "label", children: t('ask.exampleOf', { piece: example.label[lang] }) }), _jsx("p", { className: "t-sm", style: { whiteSpace: 'pre-line' }, children: example.text[lang] }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm self-start", onClick: () => useExample(example), children: t('ask.useExample') })] })), _jsx(AskAttachments, { brandId: brandId, files: files, onChange: setFiles, onBusy: setUploading }), links.map((l) => (_jsxs("div", { className: "row g8 t-sm", children: [_jsx("a", { href: l, target: "_blank", rel: "noreferrer", className: "grow truncate", children: l }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setLinks((all) => all.filter((x) => x !== l)), "aria-label": t('ask.removeLink'), children: "\u2715" })] }, l))), more && (_jsxs("div", { className: "col g12", "data-tour": "ask-cards", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-[1fr_auto]", children: [_jsx("input", { className: "input", style: { height: 44 }, type: "url", placeholder: t('ask.linkPh'), "aria-label": t('ask.addLink'), value: link, onChange: (e) => setLink(e.target.value), onKeyDown: (e) => e.key === 'Enter' && (e.preventDefault(), addLink()) }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", style: { height: 44 }, onClick: addLink, children: t('ask.addLink') })] }), _jsxs("label", { className: "col g4", children: [_jsx("span", { className: "t-sm w7", children: t('ask.due') }), _jsx("input", { className: "input", style: { height: 44, maxWidth: 220 }, type: "date", value: dueDate, onChange: (e) => setDueDate(e.target.value) })] }), _jsx("p", { className: "t-sm w7", children: t('ask.typeOptional') }), _jsx("div", { className: "row g8 wrap", children: TAXONOMY.map((c) => (_jsx("button", { type: "button", "aria-pressed": c.id === cat, onClick: () => { setCat(c.id === cat ? '' : c.id); setDetail((d) => ({ ...d, sub: '', type: '' })); }, className: `btn btn-sm ${c.id === cat ? 'btn-primary' : 'btn-secondary'}`, children: c.label[lang] }, c.id))) }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm self-start", "aria-expanded": open, onClick: () => setOpen((o) => !o), children: open ? t('ask.hideDetail') : t('ask.addDetail') }), open && _jsx(AskDetails, { cat: cat, value: detail, onChange: setDetail }), _jsx(LessonForCategory, { category: cat || undefined })] })), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: t('ask.error') }), _jsxs("div", { className: "row between g12 wrap", "data-tour": "ask-summary", children: [_jsx("button", { type: "button", className: "btn btn-ghost btn-sm", "aria-expanded": more, onClick: () => setMore((m) => !m), children: more ? t('ask.lessOptions') : t('ask.moreOptions') }), _jsx("button", { type: "button", className: "btn btn-primary", disabled: !ready || busy, onClick: submit, children: uploading ? t('ask.uploading') : t('ask.sendSimple') })] })] }));
}
