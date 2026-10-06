import { useAuth } from '../auth/AuthProvider';
import { FullScreenMessage } from '../components/FullScreenMessage';

export function NoAccess() {
  const { user, logout } = useAuth();
  return (
    <FullScreenMessage title="Your account is not connected to a brand yet">
      <p className="max-w-sm text-sm text-black/60">
        You are signed in as {user?.email}. Nicolas will connect your brand soon.
      </p>
      <button onClick={logout} className="rounded-full border border-black/15 px-4 py-2 text-sm hover:bg-black/5">
        Sign out
      </button>
    </FullScreenMessage>
  );
}
