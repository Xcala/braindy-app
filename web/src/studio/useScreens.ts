import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { versionFileUrl } from '../requests/api';
import type { Version } from '../requests/types';
import type { WorkItem } from '../team/useWork';
import type { SeatId } from './geometry';
import type { SeatView } from './useStudio';

/** What a seat's screen shows: a piece of real work (fills the screen) or the brand's logo (centered). */
export interface ScreenShot { src: string; logo: boolean }

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

/** Each seat's screen: the work it is doing right now (its newest image), else the brand's logo.
 *  A client's studio works only on their brand, so an idle seat shows their logo too; NicoMarca's own view leaves idle screens as painted. */
export function useScreens(seats: Record<SeatId, SeatView>, logoOf: (brandId?: string) => string | null, clientView: boolean, brandLogo?: string | null) {
  const current = useMemo(() => Object.fromEntries((Object.keys(seats) as SeatId[]).map((id) => [id, seats[id].queue[0]])) as Record<SeatId, WorkItem | undefined>, [seats]);
  const key = (Object.keys(current) as SeatId[]).map((id) => `${id}:${current[id]?.id ?? ''}:${current[id]?.versionCount ?? 0}`).join('|');
  const [shots, setShots] = useState<Partial<Record<SeatId, ScreenShot>>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Partial<Record<SeatId, ScreenShot>> = {};
      await Promise.all((Object.keys(current) as SeatId[]).map(async (id) => {
        const r = current[id];
        const work = r ? await workImage(r, clientView).catch(() => null) : null;
        const logo = r ? logoOf(r.brandId) : clientView ? brandLogo ?? null : null;
        if (work) out[id] = { src: work, logo: false };
        else if (logo) out[id] = { src: logo, logo: true };
      }));
      if (alive) setShots(out);
    })();
    return () => { alive = false; };
  }, [key, clientView, brandLogo]);

  return shots;
}
