import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { accessesApi, signInOf } from './useAccesses';
import { AppLogo } from './AppLogo';
/** "US$ 15 / mes": a subscription price as people read it. */
export function priceLabel(price, currency, period, t, lang) {
    const n = price.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { maximumFractionDigits: currency === 'COP' ? 0 : 2 });
    const sym = currency === 'COP' ? '$' : currency === 'EUR' ? '€' : 'US$';
    return `${sym} ${n}${currency === 'COP' ? ' COP' : ''} / ${t(period === 'year' ? 'acc.perYear' : 'acc.perMonth')}`;
}
const fmt = (s) => `0:${String(s).padStart(2, '0')}`;
export const host = (url) => { try {
    return new URL(url).host.replace(/^www\./, '');
}
catch {
    return url;
} };
/** A small copy button with "Copied" feedback. Copying a password is logged by the caller. */
export function CopyBtn({ value, onCopied, label }) {
    const { t } = useI18n();
    const [done, setDone] = useState(false);
    return (_jsx("button", { type: "button", className: "btn btn-ghost btn-sm flex-none", style: { height: 30, width: 30, padding: 0 }, "aria-label": label, title: done ? t('common.copied') : label, onClick: async () => { await navigator.clipboard.writeText(value).catch(() => undefined); setDone(true); onCopied?.(); setTimeout(() => setDone(false), 1800); }, children: done ? '✓' : _jsxs("svg", { viewBox: "0 0 24 24", width: "15", height: "15", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "9", y: "9", width: "11", height: "11", rx: "2" }), _jsx("path", { d: "M5 15V5a2 2 0 0 1 2-2h10" })] }) }));
}
/** How you get in: Google / Outlook, or the password that reveals in place for 30 s (logged), or "Missing". */
export function PasswordCell({ brandId, a, onEdit }) {
    const { t } = useI18n();
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
    const signIn = signInOf(a);
    if (signIn !== 'password') {
        return _jsxs("span", { className: "row g8 t-sm w7", children: [_jsx(AppLogo, { name: signIn, domain: signIn === 'google' ? 'google.com' : 'outlook.com', size: 20 }), t(signIn === 'google' ? 'acc.signInGoogle' : 'acc.signInMicrosoft')] });
    }
    if (!a.hasSecret)
        return _jsxs("span", { className: "row g8", children: [_jsx("span", { className: "chip c-approve", children: t('acc.missing') }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: onEdit, children: t('acc.add') })] });
    return value ? (_jsxs("span", { className: "row g4 min-w-0", children: [_jsx("span", { className: "mono t-sm truncate", "aria-live": "polite", children: value }), _jsx("span", { className: "t-xs t-mute whitespace-nowrap", "aria-label": t('acc.hidesIn', { time: fmt(left) }), children: fmt(left) }), _jsx(CopyBtn, { value: value, label: `${t('acc.copy')} · ${t('acc.password')}`, onCopied: () => accessesApi.copied(brandId, a.id).catch(() => undefined) }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", style: { height: 30, padding: '0 8px' }, onClick: () => setValue(null), children: t('acc.hide') })] })) : (_jsxs("span", { className: "row g8 min-w-0", children: [_jsx("span", { className: "mono t-sm t-mute", "aria-label": t('acc.encrypted'), children: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", disabled: busy, onClick: reveal, children: error ? t('acc.retry') : t('acc.revealPw') })] }));
}
/** The other cells, shared by the table row and the grid card. */
export function UserCell({ a }) {
    const { t } = useI18n();
    return a.username
        ? _jsxs("span", { className: "row g4 min-w-0", children: [_jsx("span", { className: "t-sm truncate", title: a.username, children: a.username }), _jsx(CopyBtn, { value: a.username, label: `${t('acc.copy')} · ${t('acc.user')}` })] })
        : _jsx("span", { className: "t-sm t-mute", children: "\u2014" });
}
export function LinkCell({ a }) {
    const { t } = useI18n();
    return a.link
        ? _jsxs("span", { className: "row g4 min-w-0", children: [_jsxs("a", { href: a.link, target: "_blank", rel: "noreferrer", className: "t-sm truncate", style: { color: 'var(--azul)' }, children: [host(a.link), " \u2197"] }), _jsx(CopyBtn, { value: a.link, label: `${t('acc.copy')} · ${t('acc.link')}` })] })
        : _jsx("span", { className: "t-sm t-mute", children: "\u2014" });
}
export function PlanCell({ a }) {
    const { t, lang } = useI18n();
    const s = a.subscription;
    return s
        ? _jsxs("span", { className: "col min-w-0", children: [_jsx("span", { className: "t-sm w7 truncate", children: s.plan || t('acc.subscription') }), s.price != null && _jsx("span", { className: "t-xs t-mute truncate", children: priceLabel(s.price, s.currency ?? 'USD', s.period, t, lang) })] })
        : _jsx("span", { className: "t-sm t-mute", children: "\u2014" });
}
/** Six dots to drag the app to another place; ↑ ↓ on the keyboard do the same. */
export function DragHandle({ label, onMove }) {
    return (_jsx("button", { type: "button", className: "acc-handle", "aria-label": label, title: label, onKeyDown: (e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            onMove(e.key === 'ArrowUp' ? -1 : 1);
        } }, children: _jsx("svg", { viewBox: "0 0 10 16", width: "10", height: "16", fill: "currentColor", "aria-hidden": "true", children: [3, 8, 13].flatMap((y) => [2, 8].map((x) => _jsx("circle", { cx: x, cy: y, r: "1.5" }, `${x}${y}`))) }) }));
}
