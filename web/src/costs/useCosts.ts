import { useEffect, useState } from 'react';
import { collection, collectionGroup, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Plan } from '../billing/useBilling';

/** Claude Max 20x, USD per month (Nicolas, 2026-10-31). Split across brands by their share of session spend. */
export const MAX_USD = 200;

type Usage = {
  brandId: string | null; project?: string; source: 'api' | 'claude-code'; model: string; usd: number;
  input: number; output: number; cacheWrite5m: number; cacheWrite1h: number; cacheRead: number;
};
export type BrandCost = {
  key: string; brandId: string | null; project?: string; eq: number; api: number; max: number; real: number; share: number;
  tokens: number; pieces: number | null; perPiece: number | null; plan: Plan | null;
};
export type ModelCost = { key: string; model: string; source: Usage['source']; input: number; output: number; cacheW: number; cacheR: number; usd: number; share: number };
export type Costs = { brands: BrandCost[]; models: ModelCost[]; real: number; eq: number; api: number; tokens: number; cachePct: number };

const tokensOf = (u: Usage) => u.input + u.output + u.cacheWrite5m + u.cacheWrite1h + u.cacheRead;

/** Pieces approved in the month: what "cost per piece" divides by. */
async function piecesIn(brandId: string, month: string) {
  const [y, m] = month.split('-').map(Number);
  const s = await getDocs(query(collection(db, 'brands', brandId, 'requests'),
    where('approvedAt', '>=', Timestamp.fromDate(new Date(Date.UTC(y, m - 1, 1)))), where('approvedAt', '<', Timestamp.fromDate(new Date(Date.UTC(y, m, 1))))));
  return s.size;
}

/** Admin only: every AI cost of a month, per brand and per model. Rules let only the admin read usage. */
export function useCosts(month: string): Costs | null {
  const [costs, setCosts] = useState<Costs | null>(null);
  useEffect(() => {
    let live = true;
    setCosts(null);
    (async () => {
      const [owned, loose, plans] = await Promise.all([
        getDocs(query(collectionGroup(db, 'usage'), where('month', '==', month))),
        getDocs(query(collection(db, 'usageUnassigned'), where('month', '==', month))),
        getDocs(collectionGroup(db, 'billing')),
      ]);
      const rows: Usage[] = [
        ...owned.docs.map((d) => ({ ...(d.data() as Usage), brandId: d.ref.parent.parent!.id })),
        ...loose.docs.map((d) => ({ ...(d.data() as Usage), brandId: null })),
      ];
      const planOf = new Map(plans.docs.filter((d) => d.id === 'plan').map((d) => [d.ref.parent.parent!.id, d.data() as Plan]));
      const sessionsEq = rows.filter((r) => r.source === 'claude-code').reduce((n, r) => n + r.usd, 0);

      const byBrand = new Map<string, BrandCost>();
      const byModel = new Map<string, ModelCost>();
      for (const r of rows) {
        const key = r.brandId ?? `_${r.project}`;
        const b = byBrand.get(key) ?? { key, brandId: r.brandId, project: r.project, eq: 0, api: 0, max: 0, real: 0, share: 0, tokens: 0, pieces: null, perPiece: null, plan: r.brandId ? planOf.get(r.brandId) ?? null : null };
        if (r.source === 'claude-code') { b.eq += r.usd; b.max += sessionsEq ? (MAX_USD * r.usd) / sessionsEq : 0; } else b.api += r.usd;
        b.tokens += tokensOf(r);
        byBrand.set(key, b);
        const mk = `${r.source}|${r.model}`;
        const m = byModel.get(mk) ?? { key: mk, model: r.model, source: r.source, input: 0, output: 0, cacheW: 0, cacheR: 0, usd: 0, share: 0 };
        m.input += r.input; m.output += r.output; m.cacheW += r.cacheWrite5m + r.cacheWrite1h; m.cacheR += r.cacheRead; m.usd += r.usd;
        byModel.set(mk, m);
      }
      const brands = [...byBrand.values()];
      for (const b of brands) b.real = b.max + b.api;
      const real = brands.reduce((n, b) => n + b.real, 0);
      await Promise.all(brands.filter((b) => b.brandId).map(async (b) => {
        b.pieces = await piecesIn(b.brandId!, month).catch(() => null);
        b.perPiece = b.pieces ? b.real / b.pieces : null;
      }));
      for (const b of brands) b.share = real ? b.real / real : 0;
      const models = [...byModel.values()];
      const allUsd = models.reduce((n, m) => n + m.usd, 0);
      for (const m of models) m.share = allUsd ? m.usd / allUsd : 0;
      const tokens = rows.reduce((n, r) => n + tokensOf(r), 0);
      const cacheR = rows.reduce((n, r) => n + r.cacheRead, 0);
      if (live) setCosts({
        brands: brands.sort((a, b) => b.real - a.real), models: models.sort((a, b) => b.usd - a.usd),
        real, eq: sessionsEq, api: brands.reduce((n, b) => n + b.api, 0), tokens, cachePct: tokens ? Math.round((cacheR / tokens) * 100) : 0,
      });
    })().catch(() => live && setCosts({ brands: [], models: [], real: 0, eq: 0, api: 0, tokens: 0, cachePct: 0 }));
    return () => { live = false; };
  }, [month]);
  return costs;
}
