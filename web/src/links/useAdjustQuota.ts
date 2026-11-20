import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export type AdjustQuota = {
  plan: string | null; limit: number; extra: number; used: number; held: number; left: number; month: string; resets: string;
  pack: { credits: number; price: number; currency: string }; per: number;
};

/**
 * The brand's monthly quota of site adjustments (by hosting plan, plus packs bought). null = no quota (no limit);
 * undefined = still loading. It asks again when `key` changes (e.g. a request moved) and when the tab comes back.
 */
export function useAdjustQuota(brandId?: string, key = '') {
  const [quota, setQuota] = useState<AdjustQuota | null | undefined>(undefined);
  const load = useCallback(() => {
    if (!brandId) return;
    api<{ quota: AdjustQuota | null }>(`/v1/brands/${brandId}/adjust-quota`).then((r) => setQuota(r.quota), () => setQuota(null));
  }, [brandId]);
  useEffect(() => { setQuota(undefined); load(); }, [load]);
  useEffect(() => { if (key) load(); }, [key, load]);
  useEffect(() => {
    const on = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [load]);
  return { quota, reload: load };
}

/** Opens Stripe Checkout for one pack; comes back to the page it was bought from. */
export async function buyPack(brandId: string) {
  const back = window.location.pathname + window.location.search;
  const r = await api<{ url: string }>(`/v1/brands/${brandId}/adjust-quota/pack`, { method: 'POST', body: JSON.stringify({ back }) });
  window.location.assign(r.url);
}
