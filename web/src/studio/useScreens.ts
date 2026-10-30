import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { versionFileUrl } from '../requests/api';
import type { Version } from '../requests/types';
import type { BrainId } from '../requests/taxonomy';
import type { WorkItem } from '../team/useWork';
import type { SeatId } from './geometry';
import type { SeatView } from './useStudio';

const BRAINS: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];
const isImage = (f: { contentType?: string }) => String(f.contentType ?? '').startsWith('image/');

/** Image of the newest version of a request. A client only ever gets versions already published to them. */
async function workImage(r: WorkItem, clientView: boolean): Promise<string | null> {
  if (!r.versionCount) return null;
  const snap = await getDocs(collection(db, 'brands', r.brandId, 'requests', r.id, 'versions'));
  const versions = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Version)
    .filter((v) => !clientView || v.published).sort((a, b) => b.n - a.n);
  for (const v of versions) {
    const i = (v.files ?? []).findIndex(isImage);
    if (i >= 0) return versionFileUrl(r.brandId, r.id, v.id, i).catch(() => null);
  }
  return null;
}

/** Each Brain's screen: the newest image of the request it is on, shown as a hologram on its glass.
 *  A seat with no image yet keeps its painted screen, and so does NicoMarca's white one (a hologram does not read on it). */
export function useScreens(seats: Record<SeatId, SeatView>, clientView: boolean) {
  const current = useMemo(() => Object.fromEntries(BRAINS.map((id) => [id, seats[id].queue[0]])) as Record<BrainId, WorkItem | undefined>, [seats]);
  const key = BRAINS.map((id) => `${id}:${current[id]?.id ?? ''}:${current[id]?.versionCount ?? 0}`).join('|');
  const [shots, setShots] = useState<Partial<Record<SeatId, string>>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Partial<Record<SeatId, string>> = {};
      await Promise.all(BRAINS.map(async (id) => {
        const r = current[id];
        const src = r ? await workImage(r, clientView).catch(() => null) : null;
        if (src) out[id] = src;
      }));
      if (alive) setShots(out);
    })();
    return () => { alive = false; };
    // `key` stands for `current`: refetch only when a seat moves to another request or gets a new version.
  }, [key, clientView]); // eslint-disable-line react-hooks/exhaustive-deps

  return shots;
}
