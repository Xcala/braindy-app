import { normalizeSearch } from '../lib/text';

/** Edit distance between two short words (Levenshtein), stopping early once it passes `max`. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, row[j]);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/**
 * «Did you mean …?» for a search with no results (UX #13): every query word that matches nothing is swapped
 * for the closest word in the searchable texts (edit distance ≤ 2; ≤ 1 for words under 5 letters).
 * Returns null when nothing close enough exists.
 */
export function suggestQuery(query: string, texts: string[]): string | null {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const vocab = new Set<string>();
  for (const t of texts) for (const w of normalizeSearch(t).split(/[^a-z0-9ñ]+/)) if (w.length >= 3) vocab.add(w);
  const all = [...vocab];
  let changed = false;
  const out = words.map((w) => {
    if (all.some((v) => v.includes(w))) return w;
    const max = w.length < 5 ? 1 : 2;
    let best: string | null = null;
    let bestD = max + 1;
    for (const v of all) {
      const d = distance(w, v, max);
      if (d < bestD || (d === bestD && best && v.length < best.length)) { best = v; bestD = d; }
    }
    if (best && bestD <= max) { changed = true; return best; }
    return w;
  });
  return changed ? out.join(' ') : null;
}
