import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useBrandLinks } from '../links/useBrandLinks';
import { useAccesses } from '../accesses/useAccesses';
import { useLessons } from '../criterio/useCriterio';
import { useMySections } from '../team/sections';
/** Files of the brand that match q, from the API (Firestore cannot match words inside names). Debounced. */
export function useFileSearch(brandId, q, enabled) {
    const [state, setState] = useState({ q: '', files: [], total: 0, loading: false });
    useEffect(() => {
        const needle = q.trim();
        if (!brandId || !enabled || needle.length < 2) {
            setState({ q: needle, files: [], total: 0, loading: false });
            return;
        }
        setState((s) => ({ ...s, loading: true }));
        let live = true;
        const timer = setTimeout(() => {
            api(`/v1/brands/${encodeURIComponent(brandId)}/search/files?q=${encodeURIComponent(needle)}`)
                .then((r) => live && setState({ q: needle, files: r.files, total: r.total, loading: false }))
                .catch(() => live && setState({ q: needle, files: [], total: 0, loading: false }));
        }, 250);
        return () => { live = false; clearTimeout(timer); };
    }, [brandId, q, enabled]);
    return state;
}
/** The rest of the brand the box can find on the device: apps, research, connectors (names only) and lessons. */
export function useSearchSources(brandId) {
    const { can } = useMySections();
    const apps = useBrandLinks(can('apps') ? brandId : undefined, 'apps').links;
    const research = useBrandLinks(can('research') ? brandId : undefined, 'research').links;
    const connectors = useAccesses(can('accesses') ? brandId : undefined);
    const lessons = useLessons().list;
    return {
        links: [...apps, ...research],
        connectors: connectors.denied ? [] : connectors.list,
        lessons: (can('learn') ? lessons.filter((l) => l.status === 'published') : []),
    };
}
