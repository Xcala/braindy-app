import { useEffect, useSyncExternalStore } from 'react';
// The version being viewed is shared by Mi marca, Files and Apps: choosing iPark in one shows iPark in the others.
// Per brand, for this tab only (back to the current version on reload). null = the current version.
const viewing = new Map();
const listeners = new Set();
const subscribe = (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function useVersionView(brandId, known) {
    const id = useSyncExternalStore(subscribe, () => (brandId ? viewing.get(brandId) ?? null : null));
    const set = (v) => { if (!brandId)
        return; viewing.set(brandId, v); listeners.forEach((fn) => fn()); };
    // A version that no longer exists (or another brand's) falls back to the current one.
    const valid = id && known.includes(id) ? id : null;
    useEffect(() => { if (id && known.length && !known.includes(id) && brandId)
        set(null); });
    return [valid, set];
}
