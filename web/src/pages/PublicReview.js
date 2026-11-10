import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { BrandMark } from '../brands/BrandMark';
import { publicReviewApi } from '../review/api';
import { VersionNotes } from '../requests/VersionNotes';
import { Scan } from '../components/Scan';
const BRAIN = { researcher: 'Researcher', marketer: 'Marketer', creator: 'Creator', builder: 'Builder' };
const isImage = (t) => !!t && t.startsWith('image/');
/** Review by link (design 31): one delivery, one person, approve or ask for changes. No login. */
export function PublicReview() {
    const { token = '' } = useParams();
    const { t, lang } = useI18n();
    const [data, setData] = useState(null);
    const [fail, setFail] = useState(null);
    const [changes, setChanges] = useState(false);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(null);
    const [error, setError] = useState(false);
    useEffect(() => {
        publicReviewApi.load(token).then(setData).catch((e) => setFail(e.status === 410 ? 'expired' : 'not_found'));
    }, [token]);
    async function decide(state) {
        setBusy(true);
        setError(false);
        try {
            await publicReviewApi.decide(token, state, note.trim());
            setDone(state);
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    const shell = (body) => (_jsxs("div", { className: "min-h-full", style: { background: 'var(--niebla)' }, children: [_jsxs("header", { className: "row between g12", style: { padding: '16px 20px' }, children: [_jsx("img", { src: "/brand/braindy-logo.svg", alt: "Braindy", style: { height: 24 } }), _jsx(LangToggle, {})] }), _jsx("main", { className: "mx-auto col g20 w-full max-w-[720px] px-4 pb-16", children: body })] }));
    if (fail)
        return shell(_jsxs("div", { className: "card col g8", children: [_jsx("h1", { className: "h2", children: t(fail === 'expired' ? 'rev.expired' : 'rev.notFound') }), _jsx("p", { className: "t-mute", children: t('rev.askNew') })] }));
    if (!data)
        return shell(_jsxs("p", { className: "t-mute", "aria-busy": "true", children: [t('common.loading'), "\u2026"] }));
    const until = new Date(data.expiresAt).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', day: 'numeric' });
    const decided = done ?? (data.used ? data.version.approval?.state : null);
    const brain = BRAIN[data.version.brain ?? data.request.leadBrain] ?? 'Braindy';
    return shell(_jsxs(_Fragment, { children: [_jsx("p", { className: "t-xs t-mute", role: "note", children: t('rev.scope', { date: until }) }), _jsxs("div", { className: "row g12", children: [_jsx("span", { className: "sel", style: { border: 0, padding: 0, height: 'auto', background: 'none' }, children: _jsx(BrandMark, { brand: data.brand }) }), _jsx("span", { className: "w7", children: data.brand.name })] }), _jsxs("div", { className: "col g4", children: [_jsx("h1", { className: "h1", children: data.request.title }), _jsxs("p", { className: "t-mute", children: [t('home.version', { n: data.version.n }), " \u00B7 ", data.request.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain })] })] }), _jsx("div", { className: "col g12", children: data.version.files.map((f, i) => f.url && isImage(f.contentType)
                    ? _jsx("img", { src: f.url, alt: f.name, className: "w-full rounded-2xl", style: { background: '#fff' } }, i)
                    : _jsxs("a", { className: "card row between g12", href: f.url ?? '#', target: "_blank", rel: "noreferrer", children: [_jsx("span", { className: "w7 truncate", children: f.name }), _jsx("span", { className: "t-sm", children: t('rev.openFile') })] }, i)) }), data.version.notes && _jsx(VersionNotes, { text: data.version.notes }), data.version.reason && (_jsxs("div", { className: "card col g4", children: [_jsx("p", { className: "label", children: t('req.whyItWorks') }), _jsx(Scan, { text: data.version.reason, points: true, tone: "ink" })] })), decided ? (_jsxs("div", { className: "card col g8", role: "status", children: [_jsx("h2", { className: "h3", children: t(decided === 'approved' ? 'rev.doneApproved' : 'rev.doneChanges') }), _jsx("p", { className: "t-sm t-mute", children: t('rev.doneBody') })] })) : changes ? (_jsxs("div", { className: "card col g12", children: [_jsxs("label", { className: "field", children: [_jsx("span", { className: "w7", children: t('rev.whatToChange') }), _jsx("textarea", { className: "input", rows: 4, value: note, onChange: (e) => setNote(e.target.value), style: { height: 'auto', paddingTop: 10 }, autoFocus: true })] }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("button", { className: "btn btn-primary", disabled: busy || !note.trim(), onClick: () => decide('changes_requested'), children: t('rev.sendChanges') }), _jsx("button", { className: "btn btn-ghost", onClick: () => setChanges(false), children: t('common.cancel') })] })] })) : (_jsxs("div", { className: "row g12 wrap", children: [_jsx("button", { className: "btn btn-primary btn-lg", disabled: busy, onClick: () => decide('approved'), children: t('rev.approve') }), _jsx("button", { className: "btn btn-secondary btn-lg", onClick: () => setChanges(true), children: t('rev.requestChanges') })] })), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: t('rev.decideError') }), _jsxs("p", { className: "t-xs t-mute", children: [t('rev.fullApp'), " ", _jsx("a", { href: "/login", className: "w7", children: t('rev.signIn') })] })] }));
}
