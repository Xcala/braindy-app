import { useEffect, useState } from 'react';
import { collection, collectionGroup, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
/** Claude Max 20x, USD per month (Nicolas, 2026-10-31). Split across brands by their share of session spend. */
export const MAX_USD = 200;
const tokensOf = (u) => u.input + u.output + u.cacheWrite5m + u.cacheWrite1h + u.cacheRead;
/** Pieces approved in the period (whole months, oldest to newest): what "cost per piece" divides by. */
async function piecesIn(brandId, months) {
    const [y0, m0] = months[0].split('-').map(Number);
    const [y1, m1] = months[months.length - 1].split('-').map(Number);
    const s = await getDocs(query(collection(db, 'brands', brandId, 'requests'), where('approvedAt', '>=', Timestamp.fromDate(new Date(Date.UTC(y0, m0 - 1, 1)))), where('approvedAt', '<', Timestamp.fromDate(new Date(Date.UTC(y1, m1, 1))))));
    return s.size;
}
/** Admin only: every AI cost of a period (whole months, up to 30), per brand and per model. Rules let only the admin read usage. */
export function useCosts(period) {
    const key = [...period].sort().join(',');
    const [costs, setCosts] = useState(null);
    useEffect(() => {
        let live = true;
        setCosts(null);
        const months = key.split(',');
        (async () => {
            const [owned, loose, plans] = await Promise.all([
                getDocs(query(collectionGroup(db, 'usage'), where('month', 'in', months))),
                getDocs(query(collection(db, 'usageUnassigned'), where('month', 'in', months))),
                getDocs(collectionGroup(db, 'billing')),
            ]);
            const rows = [
                ...owned.docs.map((d) => ({ ...d.data(), brandId: d.ref.parent.parent.id })),
                ...loose.docs.map((d) => ({ ...d.data(), brandId: null })),
            ];
            const planOf = new Map(plans.docs.filter((d) => d.id === 'plan').map((d) => [d.ref.parent.parent.id, d.data()]));
            // Claude Max is prorated month by month: each month's US$200 split by that month's session spend.
            const eqByMonth = new Map();
            for (const r of rows)
                if (r.source === 'claude-code')
                    eqByMonth.set(r.month, (eqByMonth.get(r.month) ?? 0) + r.usd);
            const sessionsEq = [...eqByMonth.values()].reduce((n, v) => n + v, 0);
            const byBrand = new Map();
            const byModel = new Map();
            for (const r of rows) {
                const key = r.brandId ?? `_${r.project}`;
                const b = byBrand.get(key) ?? { key, brandId: r.brandId, project: r.project, eq: 0, api: 0, max: 0, real: 0, share: 0, tokens: 0, pieces: null, perPiece: null, plan: r.brandId ? planOf.get(r.brandId) ?? null : null };
                if (r.source === 'claude-code') {
                    b.eq += r.usd;
                    const eqM = eqByMonth.get(r.month) ?? 0;
                    b.max += eqM ? (MAX_USD * r.usd) / eqM : 0;
                }
                else
                    b.api += r.usd;
                b.tokens += tokensOf(r);
                byBrand.set(key, b);
                const mk = `${r.source}|${r.model}`;
                const m = byModel.get(mk) ?? { key: mk, model: r.model, source: r.source, input: 0, output: 0, cacheW: 0, cacheR: 0, usd: 0, share: 0 };
                m.input += r.input;
                m.output += r.output;
                m.cacheW += r.cacheWrite5m + r.cacheWrite1h;
                m.cacheR += r.cacheRead;
                m.usd += r.usd;
                byModel.set(mk, m);
            }
            const brands = [...byBrand.values()];
            for (const b of brands)
                b.real = b.max + b.api;
            const real = brands.reduce((n, b) => n + b.real, 0);
            await Promise.all(brands.filter((b) => b.brandId).map(async (b) => {
                b.pieces = await piecesIn(b.brandId, months).catch(() => null);
                b.perPiece = b.pieces ? b.real / b.pieces : null;
            }));
            for (const b of brands)
                b.share = real ? b.real / real : 0;
            const models = [...byModel.values()];
            const allUsd = models.reduce((n, m) => n + m.usd, 0);
            for (const m of models)
                m.share = allUsd ? m.usd / allUsd : 0;
            const tokens = rows.reduce((n, r) => n + tokensOf(r), 0);
            const cacheR = rows.reduce((n, r) => n + r.cacheRead, 0);
            if (live)
                setCosts({
                    brands: brands.sort((a, b) => b.real - a.real), models: models.sort((a, b) => b.usd - a.usd),
                    real, eq: sessionsEq, api: brands.reduce((n, b) => n + b.api, 0), tokens, cachePct: tokens ? Math.round((cacheR / tokens) * 100) : 0, months: months.length,
                });
        })().catch(() => live && setCosts({ brands: [], models: [], real: 0, eq: 0, api: 0, tokens: 0, cachePct: 0, months: months.length }));
        return () => { live = false; };
    }, [key]);
    return costs;
}
