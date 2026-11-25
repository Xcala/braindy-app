import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, limit, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';

export type AdState = 'live' | 'review' | 'scheduled' | 'paused' | 'issue' | 'ended';
export type Format = 'vertical' | 'feed' | 'horizontal' | 'chat' | 'text' | 'audio';
export type Creative = { format: Format; kind: 'image' | 'video'; path: string; thumbPath?: string };
export type Ad = {
  id: string; name: string; state: AdState; creatives: Creative[]; requestId?: string; versionId?: string;
  text: { primary?: string; headline?: string; description?: string; cta?: string; link?: string; headlines?: string[]; descriptions?: string[] };
};
export type AdNumbers = { spend?: number | null; impressions?: number | null; reach?: number | null; clicks?: number | null; results?: number | null; resultLabel?: string };
export type AdCampaign = {
  id: string; platform: string; name: string; objective: string; state: AdState; color: string; currency: string;
  start: Date | null; end: Date | null; budget: { amount: number; period: 'daily' | 'total' } | null; ads: Ad[];
};
export type CampaignStats = { totals: AdNumbers | null; ads: Record<string, AdNumbers> };

const toDate = (v: unknown) => (v && typeof (v as { toDate?: () => Date }).toDate === 'function' ? (v as { toDate: () => Date }).toDate() : null);

/** The brand's campaigns, newest first by start. */
export function usePauta(brandId: string | undefined) {
  const [list, setList] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    return onSnapshot(collection(db, 'brands', brandId, 'adCampaigns'), (s) => {
      setList(s.docs.map((d) => {
        const x = d.data();
        return { ...(x as AdCampaign), id: d.id, start: toDate(x.start), end: toDate(x.end), ads: (x.ads ?? []) as Ad[] };
      }).sort((a, b) => (b.start?.getTime() ?? 0) - (a.start?.getTime() ?? 0)));
      setLoading(false);
    }, () => { setList([]); setLoading(false); });
  }, [brandId]);
  return { list, loading };
}

/** Whether the brand has any campaign (the Pauta tab hides otherwise). */
export function useHasPauta(brandId: string | undefined) {
  const [has, setHas] = useState(false);
  useEffect(() => {
    if (!brandId) return;
    return onSnapshot(query(collection(db, 'brands', brandId, 'adCampaigns'), limit(1)), (s) => setHas(!s.empty), () => setHas(false));
  }, [brandId]);
  return has;
}

/** One campaign's numbers, only where Results is on (the rules keep them closed otherwise). */
export function useCampaignStats(brandId: string | undefined, campaignId: string, enabled: boolean) {
  const [s, setS] = useState<CampaignStats | null>(null);
  useEffect(() => {
    if (!brandId || !enabled) { setS(null); return; }
    return onSnapshot(doc(db, 'brands', brandId, 'adCampaigns', campaignId, 'stats', 'totals'),
      (d) => setS(d.exists() ? { totals: d.get('totals') ?? null, ads: d.get('ads') ?? {} } : null), () => setS(null));
  }, [brandId, campaignId, enabled]);
  return s;
}

/** Short-lived links to the pieces kept in Braindy (refreshed when the campaigns change). */
export function usePautaMedia(brandId: string | undefined, version: string) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!brandId || !version) return;
    let live = true;
    api<{ urls: Record<string, string> }>(`/v1/brands/${brandId}/pauta/media`).then((r) => { if (live) setUrls(r.urls); }, () => undefined);
    return () => { live = false; };
  }, [brandId, version]);
  return urls;
}
