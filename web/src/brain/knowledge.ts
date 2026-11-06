// What the Brand Brain knows, counted from what the Brains actually read (see server/src/brains/context.ts):
// Mi marca (identity, voice, Primal), the Brand Brain (strategy, rules), learnings and the conversations held.
import type { StringKey } from '../i18n/strings';
import { boldLead, scanBlocks } from '../lib/scan';

export const AREAS = ['identity', 'voice', 'strategy', 'work', 'rules', 'talks'] as const;
export type Area = (typeof AREAS)[number];
export type Counts = Record<Area, number>;
type Doc = Record<string, unknown> | null | undefined;

const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const has = (v: unknown) => (typeof v === 'string' ? v.trim().length > 0 : !!v);

/**
 * Each rule on its own, for the avoid and criterio fields: sentences and comma lists ("white on green, the logo
 * gradient on color, 'Marco Polo Canadá'…") become one point each, the key in **bold**.
 */
export function ruleLines(brain: Doc): string[] {
  const text = [brain?.avoid, brain?.criterio].filter((x) => typeof x === 'string').join('\n');
  return scanBlocks(text, { list: true, points: true })
    .flatMap((b) => (b.kind === 'list' ? b.items : b.kind === 'p' ? [boldLead(b.text)] : []))
    .map((s) => s.trim().replace(/\.$/, '')).filter((s) => s.replace(/\*\*/g, '').length >= 3)
    .map((s) => (s.startsWith('**') ? `**${s[2]!.toUpperCase()}${s.slice(3)}` : s[0]!.toUpperCase() + s.slice(1)));
}

export function countKnowledge(d: { identity: Doc; voice: Doc; brain: Doc; primal: Doc; learnings: Doc; talks: number }): Counts {
  const id = d.identity ?? {};
  const logos = (id.logos ?? {}) as Record<string, unknown>;
  const v = d.voice ?? {};
  const sounds = (v.howItSounds ?? {}) as Record<string, unknown>;
  const b = d.brain ?? {};
  const p = d.primal ?? {};
  return {
    identity: ['primary', 'secondary', 'icon'].filter((k) => has(logos[k])).length + arr(logos.variations).length
      + arr(id.colors).length + arr(id.typography).length + arr(id.concept).length,
    voice: (has((v.essence as Record<string, unknown> | undefined)?.title) ? 1 : 0) + arr(v.archetype).length + arr(v.tonePrinciples).length
      + arr(v.keyLanguage).length + arr(sounds.is).length + arr(sounds.isNot).length + (has(v.example) ? 1 : 0),
    strategy: ['position', 'audiences', 'goals'].filter((k) => has(b[k])).length + arr(b.competitors).length
      + ['creationStory', 'creed', 'icons', 'rituals', 'sacredWords', 'nonBelievers', 'leader'].filter((k) => has(p[k])).length,
    work: arr(d.learnings?.items).length + arr(id.galleryAssets).length,
    rules: ruleLines(b).length,
    talks: d.talks,
  };
}

/** What is missing, in the order it matters most. */
export function gaps(d: { identity: Doc; voice: Doc; brain: Doc; learnings: Doc; talks: number }): StringKey[] {
  const id = d.identity ?? {};
  const b = d.brain ?? {};
  const out: Array<[boolean, StringKey]> = [
    [!id.logos, 'bb.gap.logos'], [!arr(id.colors).length, 'bb.gap.colors'], [!arr(id.typography).length, 'bb.gap.typography'],
    [!d.voice, 'bb.gap.voice'], [!has(b.position), 'bb.gap.position'], [!has(b.audiences), 'bb.gap.audiences'],
    [!ruleLines(b).length, 'bb.gap.avoid'], [!arr(b.competitors).length, 'bb.gap.competitors'],
    [!arr(d.learnings?.items).length, 'bb.gap.learn'], [!d.talks, 'bb.gap.talks'],
  ];
  return out.filter(([missing]) => missing).map(([, k]) => k);
}
