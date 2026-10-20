import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile } from '../lib/types';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  /** null = signed in but no profile in `braindy-app` yet (not onboarded). */
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    if (!u) {
      setProfile(null);
      setLoading(false);
    }
  }), []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    let claimed = false;
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        setLoading(false);
        // No profile yet: claim pending invitations for this email once (the snapshot updates if any).
        if (!snap.exists() && !claimed) {
          claimed = true;
          api('/v1/me/claim', { method: 'POST', body: '{}' }).catch(() => undefined);
        }
      },
      () => {
        setProfile(null);
        setLoading(false);
      },
    );
  }, [user]);

  const value: AuthState = { user, profile, loading, logout: () => signOut(auth) };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
