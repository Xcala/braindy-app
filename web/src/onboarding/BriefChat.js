import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { onboardingApi } from './api';
import { QUESTIONS } from './questions';
const AVATAR = '/brand/proposal/b3d-researcher.jpg';
/** Step 2 · Brief with the Researcher (design 17): eight questions, answered once, remembered forever. */
export function BriefChat({ brandId, brandName }) {
    const { t, lang } = useI18n();
    const brief = useBrandDoc(brandId, 'context/brief');
    const [answers, setAnswers] = useState({});
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const end = useRef(null);
    useEffect(() => { if (brief.data?.answers)
        setAnswers(brief.data.answers); }, [brief.data]);
    const done = QUESTIONS.filter((q) => answers[q.key]?.trim()).length;
    const next = QUESTIONS.find((q) => !answers[q.key]?.trim());
    useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [done]);
    async function send(skip = false) {
        if (!next)
            return;
        const value = skip ? '—' : text.trim();
        if (!value)
            return;
        setBusy(true);
        setError(null);
        try {
            await onboardingApi.answer(brandId, next.key, value);
            setAnswers((a) => ({ ...a, [next.key]: value }));
            setText('');
        }
        catch {
            setError(t('ob.sendError'));
        }
        finally {
            setBusy(false);
        }
    }
    async function finish() {
        setBusy(true);
        setError(null);
        try {
            await onboardingApi.complete(brandId);
        }
        catch {
            setError(t('ob.finishError'));
        }
        finally {
            setBusy(false);
        }
    }
    const Bubble = ({ who, children }) => (_jsxs("div", { className: "row g12", style: { alignItems: 'flex-start' }, children: [_jsx("img", { src: AVATAR, alt: "", style: { width: 44, height: 44, borderRadius: 12, objectFit: 'cover', background: '#05070D', flex: 'none' } }), _jsxs("div", { className: "col g8", style: { maxWidth: 560 }, children: [_jsx("span", { className: "t-xs t-mute w7", children: who }), _jsx("div", { className: "card", style: { padding: '14px 16px', borderRadius: '4px 16px 16px 16px' }, children: children })] })] }));
    const Mine = ({ children }) => (_jsx("div", { className: "row", style: { justifyContent: 'flex-end' }, children: _jsx("div", { style: { background: '#2F4DE0', color: '#fff', borderRadius: '16px 4px 16px 16px', padding: '14px 16px', maxWidth: 460, whiteSpace: 'pre-wrap' }, children: children }) }));
    return (_jsxs("section", { className: "col g20", "aria-labelledby": "brief-h", children: [_jsxs("div", { className: "col g8", children: [_jsxs("p", { className: "t-sm t-mute w7", children: [t('ob.day01'), " \u00B7 ", t('ob.s.brief')] }), _jsx("h1", { className: "h1", id: "brief-h", children: t('ob.briefTitle') }), _jsx("p", { className: "t-mute", children: t('ob.briefSub') })] }), _jsxs("div", { className: "row g12", children: [_jsx("div", { className: "bar grow", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 8, "aria-valuenow": done, children: _jsx("i", { style: { width: `${(done / 8) * 100}%` } }) }), _jsx("span", { className: "t-sm w7", children: t('ob.ofN', { n: done, total: 8 }) })] }), _jsxs("div", { className: "col g16", "aria-live": "polite", children: [_jsx(Bubble, { who: "Researcher", children: t('ob.hello', { name: brandName }) }), QUESTIONS.filter((q) => answers[q.key]?.trim()).map((q, i) => (_jsxs("div", { className: "col g16", children: [_jsx(Bubble, { who: `Researcher · ${i + 1} ${t('ob.of')} 8`, children: q.ask[lang] }), _jsx(Mine, { children: answers[q.key] })] }, q.key))), next && _jsx(Bubble, { who: `Researcher · ${done + 1} ${t('ob.of')} 8`, children: next.ask[lang] }), !next && _jsx(Bubble, { who: "Researcher", children: t('ob.allDone') }), _jsx("div", { ref: end })] }), next ? (_jsxs("form", { className: "glass row g12 wrap", style: { borderRadius: 18, padding: '10px 10px 10px 18px' }, onSubmit: (e) => { e.preventDefault(); send(); }, children: [_jsx("label", { className: "sr", htmlFor: "brief-in", children: next.topic[lang] }), _jsx("textarea", { id: "brief-in", className: "grow", rows: 2, value: text, onChange: (e) => setText(e.target.value), placeholder: t('ob.placeholder'), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            send();
                        } }, style: { border: 0, background: 'transparent', resize: 'none', font: 'inherit', minWidth: 200, outline: 'none' } }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", disabled: busy, onClick: () => send(true), children: t('ob.skip') }), _jsx("button", { type: "submit", className: "btn btn-primary btn-sm", disabled: busy || !text.trim(), children: t('ob.send') })] })) : (_jsx("div", { className: "row g12 wrap", children: _jsx("button", { className: "btn btn-primary", disabled: busy, onClick: finish, children: busy ? t('ob.building') : t('ob.buildBrain') }) })), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: error })] }));
}
