import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { accessesApi } from './useAccesses';
export const ALL_COLS = ['user', 'password', 'link', 'notes'];
const WIDTH = { user: 'minmax(0,1fr)', password: 'minmax(0,1.3fr)', link: 'minmax(0,0.9fr)', notes: 'minmax(0,1fr)' };
/** Grid template for the visible columns: platform first, the edit action last. */
export const gridFor = (cols) => ['minmax(0,1fr)', ...cols.map((c) => WIDTH[c]), '84px'].join(' ');
const fmt = (s) => `0:${String(s).padStart(2, '0')}`;
const host = (url) => { try {
    return new URL(url).host.replace(/^www\./, '');
}
catch {
    return url;
} };
/** A small copy button with "Copied" feedback. Copying a password is logged by the caller. */
function CopyBtn({ value, onCopied, label }) {
    const { t } = useI18n();
    const [done, setDone] = useState(false);
    return (_jsx("button", { type: "button", className: "btn btn-ghost btn-sm flex-none", style: { height: 30, width: 30, padding: 0 }, "aria-label": label, title: done ? t('common.copied') : label, onClick: async () => { await navigator.clipboard.writeText(value).catch(() => undefined); setDone(true); onCopied?.(); setTimeout(() => setDone(false), 1800); }, children: done ? '✓' : _jsxs("svg", { viewBox: "0 0 24 24", width: "15", height: "15", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "9", y: "9", width: "11", height: "11", rx: "2" }), _jsx("path", { d: "M5 15V5a2 2 0 0 1 2-2h10" })] }) }));
}
/** Credential row: each visible column copies on its own; the password reveals in place for 30 s (logged). */
export function AccessRow({ brandId, a, cols, onEdit }) {
    const { t, lang } = useI18n();
    const [busy, setBusy] = useState(false);
    const [value, setValue] = useState(null);
    const [left, setLeft] = useState(0);
    const [error, setError] = useState(false);
    useEffect(() => {
        if (!value)
            return;
        const id = window.setInterval(() => setLeft((l) => {
            if (l <= 1) {
                setValue(null);
                return 0;
            }
            return l - 1;
        }), 1000);
        return () => window.clearInterval(id);
    }, [value]);
    // Hide when the tab goes to the background.
    useEffect(() => {
        const onHide = () => document.hidden && setValue(null);
        document.addEventListener('visibilitychange', onHide);
        return () => document.removeEventListener('visibilitychange', onHide);
    }, []);
    async function reveal() {
        setBusy(true);
        setError(false);
        try {
            const r = await accessesApi.reveal(brandId, a.id);
            setValue(r.value);
            setLeft(r.seconds);
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    const date = a.updatedAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
    const sub = a.sharedWithBraindy ? t('acc.shared') : [date, a.updatedByName].filter(Boolean).join(' · ');
    const cell = {
        user: a.username
            ? _jsxs("span", { className: "row g4 min-w-0", children: [_jsx("span", { className: "t-sm truncate", title: a.username, children: a.username }), _jsx(CopyBtn, { value: a.username, label: `${t('acc.copy')} · ${t('acc.user')}` })] })
            : _jsx("span", { className: "t-sm t-mute", children: "\u2014" }),
        password: !a.hasSecret
            ? _jsxs("span", { className: "row g8", children: [_jsx("span", { className: "chip c-approve", children: t('acc.missing') }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: onEdit, children: t('acc.add') })] })
            : value ? (_jsxs("span", { className: "row g4 min-w-0", children: [_jsx("span", { className: "mono t-sm truncate", "aria-live": "polite", children: value }), _jsx("span", { className: "t-xs t-mute whitespace-nowrap", "aria-label": t('acc.hidesIn', { time: fmt(left) }), children: fmt(left) }), _jsx(CopyBtn, { value: value, label: `${t('acc.copy')} · ${t('acc.password')}`, onCopied: () => accessesApi.copied(brandId, a.id).catch(() => undefined) }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", style: { height: 30, padding: '0 8px' }, onClick: () => setValue(null), children: t('acc.hide') })] })) : (_jsxs("span", { className: "row g8 min-w-0", children: [_jsx("span", { className: "mono t-sm t-mute", "aria-label": t('acc.encrypted'), children: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", disabled: busy, onClick: reveal, children: error ? t('acc.retry') : t('acc.revealPw') })] })),
        link: a.link
            ? _jsxs("span", { className: "row g4 min-w-0", children: [_jsxs("a", { href: a.link, target: "_blank", rel: "noreferrer", className: "t-sm truncate", style: { color: 'var(--azul)' }, children: [host(a.link), " \u2197"] }), _jsx(CopyBtn, { value: a.link, label: `${t('acc.copy')} · ${t('acc.link')}` })] })
            : _jsx("span", { className: "t-sm t-mute", children: "\u2014" }),
        notes: _jsx("span", { className: "t-sm t-mute truncate", title: a.notes, children: a.notes || '—' }),
    };
    return (_jsxs("div", { className: "trow", style: { gridTemplateColumns: gridFor(cols), minHeight: 64, minWidth: 260 + cols.length * 170 }, children: [_jsxs("span", { className: "col min-w-0", children: [_jsx("span", { className: "w7 truncate", children: a.platform }), _jsx("span", { className: "t-xs t-mute truncate", children: sub })] }), cols.map((c) => _jsx("div", { className: "min-w-0", children: cell[c] }, c)), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm justify-self-end", onClick: onEdit, "aria-label": `${t('acc.edit')} · ${a.platform}`, children: t('acc.edit') })] }));
}
