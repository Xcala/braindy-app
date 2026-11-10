import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AuthLayout } from '../components/AuthLayout';
import { GoogleIcon } from '../components/Icon';
import { completeAccessLink, isAccessLink, rememberedEmail, sendAccessLink } from '../auth/emailLink';
/** Sign-in: Google, a one-time link by email (any inbox, no password) or, for those who have one, a password. */
export function Login() {
    const { user, loading } = useAuth();
    const { t, lang } = useI18n();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [withPassword, setWithPassword] = useState(false);
    const [linkSent, setLinkSent] = useState(false);
    const [fromLink] = useState(isAccessLink);
    const [message, setMessage] = useState(null);
    const [busy, setBusy] = useState(false);
    // Coming back from the emailed link: finish at once when this browser asked for it, otherwise confirm the email.
    useEffect(() => {
        if (!fromLink)
            return;
        const saved = rememberedEmail();
        if (saved)
            run(() => completeAccessLink(saved), 'login.linkError');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromLink]);
    if (!loading && user) {
        const from = location.state?.from ?? '/';
        return _jsx(Navigate, { to: from, replace: true });
    }
    async function run(fn, error = 'login.error') {
        setBusy(true);
        setMessage(null);
        try {
            await fn();
        }
        catch {
            setMessage({ kind: 'error', text: t(error) });
        }
        finally {
            setBusy(false);
        }
    }
    function onSubmit(e) {
        e.preventDefault();
        if (fromLink)
            return run(() => completeAccessLink(email.trim()), 'login.linkError');
        if (withPassword)
            return run(() => signInWithEmailAndPassword(auth, email, password));
        run(async () => { await sendAccessLink(email.trim(), lang); setLinkSent(true); });
    }
    async function forgot() {
        if (!email) {
            setMessage({ kind: 'error', text: t('login.forgotNeedsEmail') });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
        }
        catch { /* do not reveal whether the account exists */ }
        setMessage({ kind: 'info', text: t('login.forgotSent') });
    }
    const linkBtn = { background: 'none', border: 0, color: 'var(--azul)', cursor: 'pointer', padding: 0 };
    return (_jsx(AuthLayout, { children: _jsxs("form", { onSubmit: onSubmit, className: "col g24 w-full max-w-[420px]", children: [_jsxs("div", { className: "col", style: { gap: 10 }, children: [_jsxs("h2", { className: "h1", children: [t('login.title1'), _jsx("span", { className: "w9", children: "ai" }), t('login.title2')] }), _jsx("p", { className: "t-mute", children: fromLink ? t('login.linkConfirm') : t('login.subtitle') })] }), linkSent ? (_jsxs("div", { className: "card col g8", role: "status", style: { background: '#EAF7EF', border: 0 }, children: [_jsx("span", { className: "w7", children: t('login.linkSentTitle') }), _jsx("span", { className: "t-sm", children: t('login.linkSent', { email }) }), _jsx("button", { type: "button", className: "t-sm w7 self-start", style: linkBtn, onClick: () => setLinkSent(false), children: t('login.linkOther') })] })) : _jsxs(_Fragment, { children: [!fromLink && _jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: "btn btn-google btn-block", style: { height: 52 }, disabled: busy, onClick: () => run(() => signInWithPopup(auth, googleProvider)), children: [_jsx(GoogleIcon, {}), t('login.google')] }), _jsxs("div", { className: "row g16", children: [_jsx("div", { className: "divider", style: { flex: '1 1 auto', width: 'auto' } }), _jsx("span", { className: "t-sm t-mute", children: t('login.orEmail') }), _jsx("div", { className: "divider", style: { flex: '1 1 auto', width: 'auto' } })] })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "em", children: t('login.email') }), _jsx("input", { className: "input", id: "em", type: "email", required: true, autoComplete: "email", placeholder: "you@yourcompany.com", value: email, onChange: (e) => setEmail(e.target.value) })] }), withPassword && !fromLink && (_jsxs("div", { className: "field", children: [_jsxs("div", { className: "row between", style: { alignItems: 'baseline' }, children: [_jsx("label", { htmlFor: "pw", children: t('login.password') }), _jsx("button", { type: "button", onClick: forgot, className: "t-sm w7", style: linkBtn, children: t('login.forgot') })] }), _jsx("input", { className: "input", id: "pw", type: "password", required: true, autoComplete: "current-password", placeholder: t('login.passwordPlaceholder'), value: password, onChange: (e) => setPassword(e.target.value) })] })), message && (_jsx("p", { role: message.kind === 'error' ? 'alert' : 'status', className: "t-sm", style: { color: message.kind === 'error' ? 'var(--danger)' : 'var(--success)' }, children: message.text })), _jsx("button", { className: "btn btn-primary btn-block", type: "submit", style: { height: 52 }, disabled: busy, children: fromLink ? t('login.linkFinish') : withPassword ? t('login.submit') : t('login.sendLink') }), !fromLink && (_jsx("p", { className: "t-sm t-mute text-center", children: withPassword ? _jsx("button", { type: "button", className: "t-sm w7", style: linkBtn, onClick: () => setWithPassword(false), children: t('login.useLink') })
                                : _jsxs(_Fragment, { children: [t('login.linkHint'), " ", _jsx("button", { type: "button", className: "t-sm w7", style: linkBtn, onClick: () => setWithPassword(true), children: t('login.usePassword') })] }) }))] }), _jsxs("p", { className: "t-sm t-mute text-center", children: [t('login.invite'), " ", _jsx("a", { href: "mailto:nicolas@braindy.co", className: "w7", children: t('login.writeNicolas') })] })] }) }));
}
