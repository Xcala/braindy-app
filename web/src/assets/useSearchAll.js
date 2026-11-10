import { useEffect, useState } from 'react';
import { api } from '../lib/api';
/** Files in every folder of the brand whose name matches (server search; same visibility rules as Files). */
export function useSearchAll(brandId, needle, on, version) {
    const [hits, setHits] = useState(null);
    useEffect(() => {
        if (!on || needle.length < 2) {
            setHits(null);
            return;
        }
        let live = true;
        const id = setTimeout(() => {
            api(`/v1/brands/${encodeURIComponent(brandId)}/search/files?limit=100&q=${encodeURIComponent(needle)}`)
                .then((r) => live && setHits(r.files)).catch(() => live && setHits([]));
        }, 250);
        return () => { live = false; clearTimeout(id); };
    }, [brandId, needle, on, version]);
    return hits;
}
