import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useBrandLinks, type BrandLink } from '../links/useBrandLinks';
import { useAccesses } from '../accesses/useAccesses';
import { useLessons, type Lesson } from '../criterio/useCriterio';
import { useMySections } from '../team/sections';

export type FileHit = { id: string; title: string; folder: string; contentType: string };

/** Files of the brand that match q, from the API (Firestore cannot match words inside names). Debounced. */
export function useFileSearch(brandId: string | undefined, q: string, enabled: boolean) {
  const [state, setState] = useState<{ q: string; files: FileHit[]; total: number; loading: boolean }>({ q: '', files: [], total: 0, loading: false });
  useEffect(() => {
    const needle = q.trim();
    if (!brandId || !enabled || needle.length < 2) { setState({ q: needle, files: [], total: 0, loading: false }); return; }
    setState((s) => ({ ...s, loading: true }));
    let live = true;
    const timer = setTimeout(() => {
      api<{ files: FileHit[]; total: number }>(`/v1/brands/${encodeURIComponent(brandId)}/search/files?q=${encodeURIComponent(needle)}`)
        .then((r) => live && setState({ q: needle, files: r.files, total: r.total, loading: false }))
        .catch(() => live && setState({ q: needle, files: [], total: 0, loading: false }));
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [brandId, q, enabled]);
  return state;
}

/** The rest of the brand the box can find on the device: apps, research, connectors (names only) and lessons. */
export function useSearchSources(brandId: string | undefined) {
  const { can } = useMySections();
  const apps = useBrandLinks(can('apps') ? brandId : undefined, 'apps').links;
  const research = useBrandLinks(can('research') ? brandId : undefined, 'research').links;
  const connectors = useAccesses(can('accesses') ? brandId : undefined);
  const lessons = useLessons().list;
  return {
    links: [...apps, ...research] as BrandLink[],
    connectors: connectors.denied ? [] : connectors.list,
    lessons: (can('learn') ? lessons.filter((l) => l.status === 'published') : []) as Lesson[],
  };
}
