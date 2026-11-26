import type { BrandRequest } from '../types';

// «Is it the same as…?» (2026-11-20): Sanuteam sent one request twice and the team did the work twice. Before
// sending, an open request of the last two days that says much the same is offered instead. Plain word overlap, no AI.
const STOP = new Set(['para', 'como', 'con', 'una', 'uno', 'unos', 'unas', 'los', 'las', 'del', 'que', 'por', 'este', 'esta', 'esto', 'the', 'and', 'for', 'with', 'this', 'that', 'from']);
const words = (s: string) => new Set(s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9ñ]+/).filter((w) => w.length > 3 && !STOP.has(w)));
const WINDOW_MS = 48 * 3600_000;

export function findDuplicate(list: BrandRequest[], title: string, text: string): BrandRequest | null {
  const mine = words(`${title} ${text}`);
  if (mine.size < 2) return null;
  const since = Date.now() - WINDOW_MS;
  let best: { r: BrandRequest; score: number } | null = null;
  for (const r of list) {
    if (r.archived || r.cancelled || (r.status !== 'in_production' && r.status !== 'to_approve')) continue;
    if ((r.createdAt?.toMillis() ?? 0) < since) continue;
    const theirs = words(`${r.title} ${r.cards?.product?.text ?? ''}`);
    if (!theirs.size) continue;
    let same = 0;
    for (const w of mine) if (theirs.has(w)) same++;
    // Share of the smaller side, so a short new request inside a longer one still counts.
    const score = same / Math.min(mine.size, theirs.size);
    if (same >= 2 && score >= 0.5 && (!best || score > best.score)) best = { r, score };
  }
  return best?.r ?? null;
}
