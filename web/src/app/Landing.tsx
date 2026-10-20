import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';

/** Where "/" lands: Nicolas starts in his admin space (Team); clients start at Home. */
export function Landing() {
  const { profile } = useAuth();
  return <Navigate to={profile?.role === 'admin' ? '/team' : '/home'} replace />;
}
