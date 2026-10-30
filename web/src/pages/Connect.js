import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AuthLayout } from '../components/AuthLayout';
/** Consent for the remote Braindy connector: Claude asks to act in Braindy App as NickMark. Admins only. */
export function Connect() {
    const { t } = useI18n();
    const { profile } = useAuth();
    const [params] = useSearchParams();
    const req = params.get('req') ?? '';
    const [info, setInfo] = useState(null);
    const [state, setState] = useState('loading');
    useEffect(() => {
        if (!req) {
            setState('expired');
            return;
        }
        api(`/v1/connector/requests/${encodeURIComponent(req)}`)
            .then((r) => { setInfo(r); setState('ready'); }).catch(() => setState('expired'));
    }, [req]);
    async function decide(decision) {
        setState('busy');
        try {
            const { redirect } = await api(`/v1/connector/requests/${encodeURIComponent(req)}/${decision}`, { method: 'POST', body: '{}' });
            setState('done');
            window.location.assign(redirect);
        }
        catch {
            setState('expired');
        }
    }
    const isAdmin = profile?.role === 'admin';
    return (_jsx(AuthLayout, { children: _jsxs("div", { className: "col g16", style: { maxWidth: 420 }, children: [_jsx("img", { src: "/brand/braindy-logo.svg", alt: "Braindy", style: { height: 28, width: 'auto', alignSelf: 'flex-start' } }), !isAdmin ? _jsx("p", { className: "t-mute", children: t('connect.adminOnly') })
                    : state === 'loading' ? _jsx("div", { className: "skel", style: { height: 120 } })
                        : state === 'expired' ? _jsx("p", { className: "t-mute", children: t('connect.expired') })
                            : state === 'done' ? _jsx("p", { className: "t-mute", children: t('connect.done') })
                                : (_jsxs(_Fragment, { children: [_jsx("h1", { className: "h2", children: t('connect.title', { client: info?.clientName ?? 'Claude' }) }), _jsx("p", { className: "t-sm t-mute", children: t('connect.sub') }), _jsxs("ul", { className: "col g8 t-sm", style: { paddingLeft: 18, listStyle: 'disc' }, children: [_jsx("li", { children: t('connect.can1') }), _jsx("li", { children: t('connect.can2') }), _jsx("li", { children: t('connect.can3') })] }), _jsx("p", { className: "t-xs t-mute", children: t('connect.never') }), _jsx("p", { className: "t-xs t-mute", children: t('connect.returnTo', { host: info?.redirectHost ?? '' }) }), _jsxs("div", { className: "row g12", children: [_jsx("button", { type: "button", className: "btn btn-primary", disabled: state === 'busy', onClick: () => decide('approve'), children: t('connect.allow') }), _jsx("button", { type: "button", className: "btn btn-secondary", disabled: state === 'busy', onClick: () => decide('deny'), children: t('common.cancel') })] })] }))] }) }));
}
