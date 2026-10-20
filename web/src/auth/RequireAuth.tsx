import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthProvider';
import { NoAccess } from '../pages/NoAccess';

export function RequireAuth() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center" aria-busy="true">
        <img src="/brand/braindy-logo.svg" alt="Braindy" className="h-8 w-auto opacity-60" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) return <NoAccess />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { profile } = useAuth();
  return profile?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}
