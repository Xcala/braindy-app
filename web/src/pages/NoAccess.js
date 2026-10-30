import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AuthLayout } from '../components/AuthLayout';
import { Icon } from '../components/Icon';
export function NoAccess() {
    const { user, logout } = useAuth();
    const { t } = useI18n();
    return (_jsx(AuthLayout, { children: _jsxs("div", { className: "col g24 w-full max-w-[440px]", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-[20px]", style: { background: 'var(--warning-bg)', color: 'var(--warning)' }, children: _jsx(Icon, { name: "unlink", size: 30 }) }), _jsxs("div", { className: "col g12", children: [_jsx("h2", { className: "h1", children: t('noaccess.title') }), _jsxs("p", { className: "t-lg t-mute", children: [t('noaccess.signedAs'), " ", _jsx("strong", { style: { color: 'var(--ink)' }, children: user?.email }), t('noaccess.noBrand')] })] }), _jsxs("div", { className: "card card-tight col g12", style: { background: 'var(--niebla)', border: 0 }, children: [_jsx("p", { className: "label", children: t('noaccess.whatToDo') }), _jsx("p", { children: t('noaccess.body') })] }), _jsxs("div", { className: "row g12 wrap", children: [_jsx("a", { className: "btn btn-primary", href: "mailto:nicolas@braindy.co", children: t('login.writeNicolas') }), _jsx("button", { className: "btn btn-secondary", onClick: logout, children: t('noaccess.otherAccount') })] })] }) }));
}
