import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
const STORAGE_KEY = 'braindy.brand';
const BrandContext = createContext(null);
const toBrand = (id, d) => ({
    id,
    name: String(d.name ?? id),
    kind: d.kind === 'group' ? 'group' : 'brand',
    groupId: d.groupId ?? null,
    status: d.status === 'archived' ? 'archived' : 'active',
    logoUrl: d.logoUrl ?? null,
    sources: sourcesOf(d.legacyIds),
    onboarding: toOnboarding(d.onboarding),
    city: d.city ?? null,
    fileAccess: d.fileAccess ?? null,
    sectionsOff: Array.isArray(d.sectionsOff) ? d.sectionsOff : [],
    resultsOn: d.resultsOn === true,
    previousNames: Array.isArray(d.previousNames) ? d.previousNames : [],
});
const toOnboarding = (o) => o?.step ? {
    step: o.step,
    contractId: o.contractId ?? null,
    kickoffAt: o.kickoffAt?.toDate?.() ?? null,
    sessionAt: o.sessionAt?.toDate?.() ?? null,
    signedAt: o.signedAt?.toDate?.() ?? null,
    liveAt: o.liveAt?.toDate?.() ?? null,
} : null;
const sourcesOf = (l) => [
    (l?.brands?.length ?? 0) > 0 && 'brands',
    (l?.orbit?.length ?? 0) > 0 && 'orbit',
    (l?.briefEmails?.length ?? 0) > 0 && 'brief',
    (l?.brandingProjects?.length ?? 0) > 0 && 'brandbook',
].filter((x) => !!x);
/** Admin sees every brand; clients see the brands listed in their profile (rules enforce the same). */
export function BrandProvider({ children }) {
    const { profile } = useAuth();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY);
        }
        catch {
            return null;
        }
    });
    const isAdmin = profile?.role === 'admin';
    const brandIds = (profile?.brandIds ?? []).join(',');
    useEffect(() => {
        if (!profile)
            return;
        if (isAdmin) {
            return onSnapshot(collection(db, 'brands'), (snap) => {
                setBrands(snap.docs.map((d) => toBrand(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name)));
                setLoading(false);
            });
        }
        // Direct brands plus, for groups, every brand below them (group members see the whole group).
        const found = new Map();
        const unsubs = new Map();
        const publish = () => setBrands([...found.values()].sort((a, b) => a.name.localeCompare(b.name)));
        const watch = (id) => {
            if (unsubs.has(id))
                return;
            unsubs.set(id, onSnapshot(doc(db, 'brands', id), (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    found.set(id, toBrand(id, data));
                    if (data.kind === 'group')
                        (data.descendants ?? []).forEach(watch);
                }
                else {
                    found.delete(id);
                }
                publish();
                setLoading(false);
            }, () => setLoading(false)));
        };
        const ids = brandIds ? brandIds.split(',') : [];
        if (!ids.length)
            setLoading(false);
        ids.forEach(watch);
        return () => unsubs.forEach((u) => u());
    }, [profile, isAdmin, brandIds]);
    const current = useMemo(() => {
        const visible = isAdmin ? brands : brands;
        return visible.find((b) => b.id === selected)
            ?? visible.find((b) => b.status === 'active' && b.id !== 'braindy')
            ?? visible[0] ?? null;
    }, [brands, selected, isAdmin]);
    const select = (id) => {
        setSelected(id);
        try {
            localStorage.setItem(STORAGE_KEY, id);
        }
        catch { /* storage unavailable */ }
    };
    return _jsx(BrandContext.Provider, { value: { brands, current, select, loading }, children: children });
}
/** Same as useBrands, but null outside the app shell (the sign-in page shows the studio without brands). */
export function useBrandsMaybe() {
    return useContext(BrandContext);
}
export function useBrands() {
    const ctx = useContext(BrandContext);
    if (!ctx)
        throw new Error('useBrands must be used inside BrandProvider');
    return ctx;
}
/** Orders brands as a tree: each group followed by its children (indented by depth). */
export function asTree(brands) {
    const byParent = new Map();
    const ids = new Set(brands.map((b) => b.id));
    for (const b of brands) {
        const parent = b.groupId && ids.has(b.groupId) ? b.groupId : null;
        byParent.set(parent, [...(byParent.get(parent) ?? []), b]);
    }
    const out = [];
    const visit = (parent, depth) => {
        for (const b of byParent.get(parent) ?? []) {
            out.push({ brand: b, depth });
            visit(b.id, depth + 1);
        }
    };
    visit(null, 0);
    return out;
}
