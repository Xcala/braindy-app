// What the Brand Brain knows, counted from what the Brains actually read (see server/src/brains/context.ts):
// Mi marca (identity, voice, Primal), the Brand Brain (strategy, rules), learnings and the conversations held.
import type { StringKey } from '../i18n/strings';
import { boldLead, scanBlocks } from '../lib/scan';

export const AREAS = ['identity', 'voice', 'strategy', 'work', 'rules', 'talks'] as const;
export type Area = (typeof AREAS)[number];
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

/** What is missing, in the order it matters most. */
export function gaps(d: { identity: Doc; voice: Doc; brain: Doc; learnings: Doc; talks: number }): StringKey[] {
  const id = d.identity ?? {};
  const b = d.brain ?? {};
  const out: Array<[boolean, StringKey]> = [
    [!id.logos, 'bb.gap.logos'], [!arr(id.colors).length, 'bb.gap.colors'], [!arr(id.typography).length, 'bb.gap.typography'],
    [!d.voice && !has(b.voice), 'bb.gap.voice'], [!has(b.position), 'bb.gap.position'], [!has(b.audiences), 'bb.gap.audiences'],
    [!ruleLines(b).length, 'bb.gap.avoid'], [!arr(b.competitors).length, 'bb.gap.competitors'],
    [!arr(d.learnings?.items).length, 'bb.gap.learn'], [!d.talks, 'bb.gap.talks'],
  ];
  return out.filter(([missing]) => missing).map(([, k]) => k);
}
