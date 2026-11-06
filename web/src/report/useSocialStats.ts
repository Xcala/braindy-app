import { useEffect, useState } from 'react';
import { collection, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type Day = { d: string } & Partial<Record<DailyKey, number | null>>;
export type DailyKey = 'followers' | 'views' | 'reach' | 'interactions' | 'posts' | 'stories' | 'engaged' | 'gained' | 'lost' | 'clicks' | 'likes' | 'comments' | 'shares' | 'saves' | 'watchMinutes' | 'reels' | 'feedPosts' | 'pageViews';
export type StatPost = {
  id: string; date: string; type: string; text: string; image: string; url: string;
  views: number | null; reach: number | null; likes: number | null; comments: number | null; saves: number | null; shares: number | null;
  interactions: number | null; engagement: number | null; clicks: number | null; watchTime: number | null; follows: number | null;
  /** Set on the all-networks view, so each post shows where it ran. */
  network?: string;
};
type Share = Array<{ name: string; n: number }>;
export type Audience = { countries: Share; cities: Share; ageGender: Array<{ age: string; gender: string; v: number }>; industry?: Share; seniority?: Share; function?: Share; companySize?: Share };
export type NetStats = { network: string; handle: string; daily: Day[]; posts: StatPost[]; audience: Audience | null; updatedAt: Date | null };

/** Order networks show in, most used first. */
const ORDER = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube'];

/** The brand's social results per network (mirrored from Metricool by the server). Rules only let them through where Results is on. */
export function useSocialStats(brandId: string | undefined, enabled: boolean) {
  const [list, setList] = useState<NetStats[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!brandId || !enabled) { setList([]); setLoading(false); return; }
    setLoading(true);
    return onSnapshot(collection(db, 'brands', brandId, 'socialStats'), (s) => {
      const rows = s.docs.map((d) => {
        const x = d.data();
        return { network: d.id, handle: x.handle ?? '', daily: x.daily ?? [], posts: x.posts ?? [], audience: x.audience ?? null, updatedAt: (x.updatedAt as Timestamp | undefined)?.toDate() ?? null } as NetStats;
      });
      const rank = (n: string) => (ORDER.indexOf(n) + 1 || 99);
      setList(rows.filter((r) => r.daily.length || r.posts.length).sort((a, b) => rank(a.network) - rank(b.network)));
      setLoading(false);
    }, () => { setList([]); setLoading(false); });
  }, [brandId, enabled]);
  return { list, loading };
}
