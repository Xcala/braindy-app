import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { reportError } from '../lib/reportError';
/** Shown instead of a blank page when a screen crashes. The error is reported; the person can go on. */
export function RouteError() {
    const err = useRouteError();
    const { t } = useI18n();
    useEffect(() => { reportError(err); }, [err]);
    return (_jsx("div", { className: "flex min-h-full items-center justify-center p-6", children: _jsxs("div", { className: "card col g12", style: { maxWidth: 480 }, children: [_jsx("img", { src: "/brand/braindy-logo.svg", alt: "Braindy", style: { height: 24, alignSelf: 'flex-start' } }), _jsx("h1", { className: "h2", children: t('err.title') }), _jsx("p", { className: "t-mute", children: t('err.body') }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("button", { className: "btn btn-primary", onClick: () => location.reload(), children: t('err.reload') }), _jsx("a", { className: "btn btn-secondary", href: "/", children: t('err.home') })] })] }) }));
}
