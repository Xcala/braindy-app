// What the Brand Brain knows, one real thing each (a color, a rule, a change asked, a meeting): the dots of the map.
// `used` mirrors what the Brains actually read before each piece (server/src/brains/context.ts); the rest is kept
// in the brand but does not go into the piece. Links are real too: where a learning came from, its palette, or the
// rule a change shares words with.
import { ruleLines, type Area } from './knowledge';
import type { BrainEvent } from './useBrainEvents';

type Doc = Record<string, unknown> | null | undefined;
export type ItemKind = 'logo' | 'color' | 'font' | 'concept' | 'voice' | 'strategy' | 'competitor' | 'primal' | 'rule' | 'liked' | 'changed' | 'request' | 'talk' | 'file';
export type Learning = { kind?: string; text?: string; requestId?: string; at?: string; retired?: boolean };
export type Item = {
  id: string; area: Area; kind: ItemKind; label: string; detail?: string; hex?: string;
  at: Date | null; requestId?: string; used: boolean; links: string[]; learning?: Learning;
  /** A learning retired with «Esto ya no aplica»: off the map, kept so it can be brought back. */
  retired?: boolean;
};

const arr = <T = unknown>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const one = (s: string, n = 160) => { const x = s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(); return x.length > n ? `${x.slice(0, n - 1)}…` : x; };
const date = (s?: string) => { const d = s ? new Date(s) : null; return d && !Number.isNaN(+d) ? d : null; };
const STOP = new Set('para como con sin una uno los las del que por más mas sus the and with for not from that this logo marca brand pieza'.split(' '));
const words = (s: string) => new Set(s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w)));

export function buildItems(d: { identity: Doc; voice: Doc; brain: Doc; primal: Doc; learnings: Doc; events: BrainEvent[] }): Item[] {
  const out: Item[] = [];
  const add = (it: Omit<Item, 'links' | 'at'> & { at?: Date | null; links?: string[] }) => out.push({ links: [], at: null, ...it });
  const id = d.identity ?? {};
  const logos = (id.logos ?? {}) as Record<string, unknown>;
  for (const k of ['primary', 'secondary', 'icon']) if (logos[k]) add({ id: `logo-${k}`, area: 'identity', kind: 'logo', label: k, used: false });
  // context.ts gives the Brains the first 6 colors and 3 typefaces.
  arr<{ name?: string; hex?: string }>(id.colors).forEach((c, i) => add({ id: `color-${i}`, area: 'identity', kind: 'color', label: c.name || c.hex || '', hex: c.hex, detail: c.hex, used: i < 6 }));
  arr<{ fontFamily?: string; name?: string; usage?: string }>(id.typography).forEach((f, i) => add({ id: `font-${i}`, area: 'identity', kind: 'font', label: f.fontFamily || f.name || '', detail: str(f.usage), used: i < 3 }));
  arr<{ title?: string; name?: string; caption?: string }>(id.concept).forEach((c, i) => { const l = c.caption || c.title || c.name || ''; if (l) add({ id: `concept-${i}`, area: 'identity', kind: 'concept', label: l, used: false }); });
  const pal = out.filter((x) => x.kind === 'color' || x.kind === 'font');
  pal.forEach((x, i) => { if (i) x.links.push(pal[i - 1]!.id); });

  const v = d.voice ?? {};
  const b = d.brain ?? {};
  const essence = str((v.essence as Record<string, unknown> | undefined)?.title) || str(v.tone);
  if (str(b.voice)) str(b.voice).split('\n').filter(Boolean).forEach((t, i) => add({ id: `bvoice-${i}`, area: 'voice', kind: 'voice', label: one(t), used: true }));
  if (essence) add({ id: 'essence', area: 'voice', kind: 'voice', label: one(essence), used: !str(b.voice) });
  const sounds = (v.howItSounds ?? {}) as Record<string, unknown>;
  [...arr<string>(v.tonePrinciples), ...arr<string>(v.keyLanguage), ...arr<string>(sounds.is), ...arr<string>(sounds.isNot)]
    .map((t) => (typeof t === 'string' ? t : str((t as { title?: string })?.title))).filter(Boolean)
    .forEach((t, i) => add({ id: `voice-${i}`, area: 'voice', kind: 'voice', label: one(t), used: false }));

  for (const k of ['position', 'audiences', 'goals']) if (str(b[k])) add({ id: `brain-${k}`, area: 'strategy', kind: 'strategy', label: k, detail: one(str(b[k]), 400), used: true });
  arr<{ name?: string; promise?: string }>(b.competitors).forEach((c, i) => add({ id: `comp-${i}`, area: 'strategy', kind: 'competitor', label: c.name || '', detail: str(c.promise), used: true }));
  const p = d.primal ?? {};
  for (const k of ['creationStory', 'creed', 'icons', 'rituals', 'sacredWords', 'nonBelievers', 'leader']) if (p[k]) add({ id: `primal-${k}`, area: 'strategy', kind: 'primal', label: k, detail: one(typeof p[k] === 'string' ? p[k] as string : JSON.stringify(p[k]), 400), used: false });

  ruleLines(b).forEach((r, i) => add({ id: `rule-${i}`, area: 'rules', kind: 'rule', label: one(r, 200), used: true }));

  // Learnings: context.ts reads the last 15 that are not retired. Retired ones stay listed (to undo) but off the map.
  const all = arr<Learning>(d.learnings?.items);
  const live = all.filter((l) => !l.retired);
  const recent = new Set(live.slice(-15));
  all.forEach((l, i) => add({
    id: `learn-${l.at ?? i}`, area: 'work', kind: l.kind === 'changed' ? 'changed' : 'liked', label: one(str(l.text), 200),
    at: date(l.at), requestId: l.requestId, used: recent.has(l), learning: l, retired: !!l.retired,
  }));

  // From the feed: requests (the last 10 go in), meetings and sessions (the last 5), files (kept, not read).
  const reqs = d.events.filter((e) => e.kind === 'request');
  reqs.forEach((e, i) => add({ id: `ev-${e.id}`, area: 'work', kind: 'request', label: one(e.text ?? '', 200), at: e.at, requestId: e.requestId, used: i < 10 }));
  d.events.filter((e) => e.kind === 'meeting' || e.kind === 'session').forEach((e, i) => add({ id: `ev-${e.id}`, area: 'talks', kind: 'talk', label: one(e.text ?? '', 200), at: e.at, used: i < 5 }));
  d.events.filter((e) => e.kind === 'file').slice(0, 12).forEach((e) => add({ id: `ev-${e.id}`, area: 'work', kind: 'file', label: one(e.text ?? '', 120), at: e.at, requestId: e.requestId, used: false }));

  // Origin: a learning (or a file) and the request it came from.
  const byReq = new Map(out.filter((x) => x.kind === 'request' && x.requestId).map((x) => [x.requestId!, x.id]));
  for (const x of out) if (x.kind !== 'request' && x.requestId && byReq.has(x.requestId)) x.links.push(byReq.get(x.requestId)!);
  // Related: a change asked and a rule that share at least two meaningful words.
  const rules = out.filter((x) => x.kind === 'rule').map((x) => [x, words(x.label)] as const);
  for (const x of out.filter((y) => y.kind === 'changed')) {
    const w = words(x.label);
    for (const [r, rw] of rules) if ([...w].filter((t) => rw.has(t)).length >= 2) x.links.push(r.id);
  }
  return out;
}

/** How connected a thing is: links out plus links in. */
export function degree(items: Item[]) {
  const n = new Map<string, number>();
  for (const x of items) { n.set(x.id, (n.get(x.id) ?? 0) + x.links.length); for (const l of x.links) n.set(l, (n.get(l) ?? 0) + 1); }
  return n;
}

export const matches = (x: Item, q: string) => {
  const s = q.trim().toLowerCase();
  return !!s && `${x.label} ${x.detail ?? ''}`.toLowerCase().includes(s);
};
