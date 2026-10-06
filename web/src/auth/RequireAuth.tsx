import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthProvider';
import { FullScreenMessage } from '../components/FullScreenMessage';
import { NoAccess } from '../pages/NoAccess';

export function RequireAuth() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenMessage title="Loading" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) return <NoAccess />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { profile } = useAuth();
  return profile?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}
