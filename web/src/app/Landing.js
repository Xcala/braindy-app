import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
/** Where "/" lands: Nicolas starts in his admin space (Today); clients start at Home. */
export function Landing() {
    const { profile } = useAuth();
    return _jsx(Navigate, { to: profile?.role === 'admin' ? '/admin/today' : '/home', replace: true });
}
