import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { publicApi } from '../proposals/api';
import { PUBLIC_COPY } from '../proposals/public/copy';
import { usePublicTracking } from '../proposals/public/usePublicTracking';
import { AcceptDialog } from '../proposals/public/AcceptDialog';
import { Signed } from '../proposals/public/Signed';
import { Braintrust, Days, FromAtoB, Hero, Options, Proof, Talk } from '../proposals/public/Sections';
/** The page a prospect opens from a tracked link. No login; every open and reading time is recorded. */
export function PublicProposal() {
    const { token = '' } = useParams();
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);
    const [lang, setLang] = useState('en');
    const [accepting, setAccepting] = useState(null);
    // One load per token: each load counts as an open, so never fetch twice (React dev re-runs effects).
    const loaded = useRef(null);
    useEffect(() => {
        if (loaded.current === token)
            return;
        loaded.current = token;
        publicApi.load(token).then((d) => { setData(d); setLang(d.lang === 'es' ? 'es' : 'en'); }).catch(() => setFailed(true));
    }, [token]);
    useEffect(() => { document.documentElement.lang = lang; }, [lang]);
    usePublicTracking(token, data?.sessionId);
    const c = PUBLIC_COPY[lang];
    if (failed)
        return _jsx("div", { className: "flex min-h-full items-center justify-center p-6", children: _jsx("p", { className: "t-lg t-mute", children: c.notFound }) });
    if (!data)
        return _jsx("div", { className: "flex min-h-full items-center justify-center", "aria-busy": "true", children: _jsx("img", { src: "/brand/braindy-logo.svg", alt: "Braindy", className: "h-8 opacity-60" }) });
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const dateLabel = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    const validLabel = data.validUntil ? new Date(`${data.validUntil}T12:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : undefined;
    const openFile = async (id) => window.open(await publicApi.fileUrl(token, id), '_blank', 'noopener');
    return (_jsxs("div", { style: { background: '#fff' }, children: [_jsxs("div", { className: "mx-auto max-w-[1440px]", children: [_jsx(Hero, { c: c, p: data, dateLabel: dateLabel, validLabel: validLabel, lang: lang, onLang: setLang }), _jsx(Proof, { c: c }), _jsx(FromAtoB, { c: c, p: data }), _jsx(Braintrust, { c: c }), _jsx(Days, { c: c }), _jsx(Options, { c: c, p: data, onPick: setAccepting }), data.acceptance && _jsx(Signed, { c: c, acceptance: data.acceptance, locale: locale, paid: new URLSearchParams(window.location.search).get('paid'), onPayAgain: () => publicApi.pay(token).then((r) => { if (r.payUrl)
                            window.location.href = r.payUrl; }).catch(() => undefined) }), _jsx(Talk, { c: c, files: data.files, onFile: openFile, onAccept: () => setAccepting(data.recommended ?? 'transform') }), _jsxs("footer", { className: "row between g16 wrap px-5 py-10 sm:px-14", style: { borderTop: '1px solid var(--line)' }, children: [_jsx("img", { src: "/brand/braindy-logo.svg", alt: "Braindy", style: { height: 28 } }), _jsx("p", { className: "t-sm t-mute", children: c.footer })] })] }), accepting && (_jsx(AcceptDialog, { c: c, token: token, option: accepting, validLabel: validLabel, prospectName: data.prospect.company || data.prospect.name || '', onClose: () => setAccepting(null) }))] }));
}
