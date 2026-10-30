import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthProvider';
import { NoAccess } from '../pages/NoAccess';
export function RequireAuth() {
    const { user, profile, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (_jsx("div", { className: "flex min-h-full items-center justify-center", "aria-busy": "true", children: _jsx("img", { src: "/brand/braindy-logo.svg", alt: "Braindy", className: "h-8 w-auto opacity-60" }) }));
    }
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location.pathname + location.search } });
    if (!profile)
        return _jsx(NoAccess, {});
    return _jsx(Outlet, {});
}
export function RequireAdmin() {
    const { profile } = useAuth();
    return profile?.role === 'admin' ? _jsx(Outlet, {}) : _jsx(Navigate, { to: "/", replace: true });
}
