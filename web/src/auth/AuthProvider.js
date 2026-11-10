import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { api } from '../lib/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (!u) {
            setProfile(null);
            setLoading(false);
        }
    }), []);
    useEffect(() => {
        if (!user)
            return;
        setLoading(true);
        let claimed = false;
        return onSnapshot(doc(db, 'users', user.uid), (snap) => {
            setProfile(snap.exists() ? snap.data() : null);
            setLoading(false);
            // No profile yet: claim pending invitations for this email once (the snapshot updates if any).
            if (!snap.exists() && !claimed) {
                claimed = true;
                api('/v1/me/claim', { method: 'POST', body: '{}' }).catch(() => undefined);
            }
        }, () => {
            setProfile(null);
            setLoading(false);
        });
    }, [user]);
    const value = { user, profile, loading, logout: () => signOut(auth) };
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
